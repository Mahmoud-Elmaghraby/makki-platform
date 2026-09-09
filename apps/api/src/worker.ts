import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { AppModule } from './app.module';
import { TranscodeProcessor, type TranscodeJobData } from './transcode/transcode.processor';
import { TRANSCODE_QUEUE_NAME } from './transcode/transcode-queue.service';

async function bootstrap() {
  const logger = new Logger('Worker');
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
