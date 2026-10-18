import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { B2StorageService } from '../storage/b2-storage.service';
import {
  lessonMediaDir,
  mediaRoot,
} from '../lesson/media-storage.util';
import {
  probeSource,
  pickSingleRendition,
  transcodeRendition,
  writeMasterPlaylist,
} from './ffmpeg-hls.util';

export interface TranscodeJobData {
  lessonId: string;
  sourceKey: string;
  /** الملف الأصلي متخزّن على قرص السيرفر (مش B2). */
  local?: boolean;
}

@Injectable()
export class TranscodeProcessor {
  private readonly logger = new Logger(TranscodeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: B2StorageService,
  ) {}

  async process(job: Job<TranscodeJobData>) {
    if (job.data.local) return this.processLocal(job.data);
    return this.processLegacy(job);
  }

  /** وضع الاستضافة على السيرفر: قراءة من القرص وكتابة HLS على القرص من غير B2. */
  private async processLocal(data: TranscodeJobData) {
    const { lessonId, sourceKey } = data;
    const sourcePath = path.join(mediaRoot(), sourceKey);
    const lessonDir = lessonMediaDir(lessonId);
    const tmpOut = path.join(lessonDir, 'hls-tmp');
    const finalOut = path.join(lessonDir, 'hls');

    // لو الملف الأصلي مش موجود وده job مكرر (متنفذ قبل كده)، منلمسش حالة
    // الدرس الجاهز ومنعلّمهوش فاشل بالغلط.
    if (!fs.existsSync(sourcePath)) {
      const current = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
      if (current?.videoReady) return;
      this.logger.error(`[${lessonId}] local source missing`);
      await this.prisma.lesson
        .update({ where: { id: lessonId }, data: { videoFailed: true } })
        .catch(() => {});
      return;
    }

    try {
      fs.rmSync(tmpOut, { recursive: true, force: true });
      fs.mkdirSync(tmpOut, { recursive: true });

      this.logger.log(`[${lessonId}] probing source (local)`);
      const probe = await probeSource(sourcePath);
      const rendition = pickSingleRendition(probe.height);

      this.logger.log(`[${lessonId}] transcoding ${rendition.name}`);
      await transcodeRendition(sourcePath, tmpOut, rendition, probe.fps);
      writeMasterPlaylist(tmpOut, [rendition]);

      // نبدّل المجلد كله مرة واحدة عشان محدش يشوف نسخة نص مكتوبة.
      fs.rmSync(finalOut, { recursive: true, force: true });
      fs.renameSync(tmpOut, finalOut);

      await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          videoReady: true,
          videoFailed: false,
          durationSeconds: probe.durationSeconds,
        },
      });

      // الملف الأصلي مش محتاجينه بعد التحويل — بنوفّر مساحة القرص.
      fs.rmSync(sourcePath, { force: true });

      // لو الدرس ده كان متخزّن على B2 قبل كده (إعادة رفع)، بنمسح نسخته
      // القديمة هناك عشان منستهلكش مساحة B2 المجانية. فشل المسح مش مشكلة.
      try {
        await this.storage.deleteByPrefix(`lessons/${lessonId}/`);
      } catch (e) {
        this.logger.warn(`[${lessonId}] old B2 cleanup skipped: ${(e as Error).message}`);
      }
      this.logger.log(`[${lessonId}] done (local)`);
    } catch (err) {
      this.logger.error(`[${lessonId}] local transcode failed`, err as Error);
      fs.rmSync(tmpOut, { recursive: true, force: true });
      fs.rmSync(sourcePath, { force: true });
      await this.prisma.lesson.update({
        where: { id: lessonId },
        data: { videoFailed: true },
      });
      throw err;
    }
  }

  private async processLegacy(job: Job<TranscodeJobData>) {
    const { lessonId, sourceKey } = job.data;
    const workDir = path.join(os.tmpdir(), `lesson-${lessonId}-${Date.now()}`);
    const sourcePath = path.join(workDir, 'source');
    const outDir = path.join(workDir, 'hls');

    try {
      fs.mkdirSync(outDir, { recursive: true });

      this.logger.log(`[${lessonId}] downloading source`);
      await this.storage.downloadToFile(sourceKey, sourcePath);

      this.logger.log(`[${lessonId}] probing source`);
      const probe = await probeSource(sourcePath);
      const renditions = [pickSingleRendition(probe.height)];

      for (const rendition of renditions) {
        this.logger.log(`[${lessonId}] transcoding ${rendition.name}`);
        await transcodeRendition(sourcePath, outDir, rendition, probe.fps);
      }

      writeMasterPlaylist(outDir, renditions);

      this.logger.log(`[${lessonId}] uploading HLS output`);
      await this.uploadDirectory(outDir, `lessons/${lessonId}/hls`);

      await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          videoReady: true,
          videoFailed: false,
          durationSeconds: probe.durationSeconds,
        },
      });

      // حذف الملف الأصلي بعد نجاح التحويل لتوفير مساحة التخزين المجانية
      try {
        await this.storage.deleteByPrefix(sourceKey);
      } catch (e) {
        this.logger.warn(`[${lessonId}] failed to delete source: ${(e as Error).message}`);
      }

      this.logger.log(`[${lessonId}] done`);
    } catch (err) {
      this.logger.error(`[${lessonId}] transcode failed`, err as Error);
      await this.prisma.lesson.update({
        where: { id: lessonId },
        data: { videoFailed: true },
      });
      throw err;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  private async uploadDirectory(localDir: string, remotePrefix: string) {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });

    for (const entry of entries) {
      const localPath = path.join(localDir, entry.name);
      const remoteKey = `${remotePrefix}/${entry.name}`;

      if (entry.isDirectory()) {
        await this.uploadDirectory(localPath, remoteKey);
        continue;
      }

      const contentType = entry.name.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : entry.name.endsWith('.ts')
          ? 'video/mp2t'
          : undefined;

      await this.storage.uploadFile(remoteKey, localPath, contentType);
    }
  }
}
