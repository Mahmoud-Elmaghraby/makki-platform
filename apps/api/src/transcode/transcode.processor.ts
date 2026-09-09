import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { B2StorageService } from '../storage/b2-storage.service';
import {
  probeSource,
  pickRenditions,
  transcodeRendition,
  writeMasterPlaylist,
} from './ffmpeg-hls.util';

export interface TranscodeJobData {
  lessonId: string;
  sourceKey: string;
}

@Injectable()
export class TranscodeProcessor {
  private readonly logger = new Logger(TranscodeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: B2StorageService,
  ) {}

  async process(job: Job<TranscodeJobData>) {
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
      const renditions = pickRenditions(probe.height);

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
