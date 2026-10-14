import 'dotenv/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { AppModule } from './app.module';
import { TranscodeProcessor, type TranscodeJobData } from './transcode/transcode.processor';
import {
  TRANSCODE_QUEUE_NAME,
  TranscodeQueueService,
} from './transcode/transcode-queue.service';
import { PrismaService } from './prisma/prisma.service';
import { isLocalMediaEnabled, mediaRoot } from './lesson/media-storage.util';

// بعد أي إعادة تشغيل: دروس فضلت "بتتجهّز" من غير ما يكون ليها job فعلي
// (مثلًا الـ API اتعمله restart في نص رفع الفيديو). لو الملف الأصلي لسه
// موجود بنجدول التحويل تاني، ولو مش موجود بنعلّمها فاشلة عشان الأدمن يعيد الرفع
// بدل ما تفضل معلّقة للأبد.
async function recoverStuckLessons(
  prisma: PrismaService,
  queue: TranscodeQueueService,
  logger: Logger,
) {
  if (!isLocalMediaEnabled()) return;
  const stuck = await prisma.lesson.findMany({
    where: {
      videoReady: false,
      videoFailed: false,
      storageKey: { not: null },
      updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });
  for (const lesson of stuck) {
    const key = lesson.storageKey as string;
    if (fs.existsSync(path.join(mediaRoot(), key))) {
      logger.warn(`[${lesson.id}] stuck lesson — re-enqueueing transcode`);
      await queue.enqueue({ lessonId: lesson.id, sourceKey: key, local: true });
    } else {
      logger.warn(`[${lesson.id}] stuck lesson with no source — marking failed`);
      await prisma.lesson.update({ where: { id: lesson.id }, data: { videoFailed: true } });
    }
  }
}

async function bootstrap() {
  const logger = new Logger('Worker');
  // أولوية أقل لعملية التحويل (وفروعها ffmpeg) عشان الـ API والموقع يفضلوا
  // سريعين وقت التحويل التقيل على نفس السيرفر.
  try {
    os.setPriority(0, 10);
  } catch {
    // مش مشكلة لو مفيش صلاحية.
  }
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const processor = appContext.get(TranscodeProcessor);

  const connection = new IORedis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker<TranscodeJobData>(
    TRANSCODE_QUEUE_NAME,
    (job: Job<TranscodeJobData>) => processor.process(job),
    { connection, concurrency: 1 },
  );

  worker.on('completed', (job) => logger.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => logger.error(`Job ${job?.id} failed`, err));

  logger.log('Video transcode worker started, waiting for jobs...');
  recoverStuckLessons(
    appContext.get(PrismaService, { strict: false }),
    appContext.get(TranscodeQueueService, { strict: false }),
    logger,
  ).catch((err) => logger.error('stuck lesson recovery failed', err as Error));

  const shutdown = async () => {
    logger.log('Shutting down worker...');
    await worker.close();
    connection.disconnect();
    await appContext.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
