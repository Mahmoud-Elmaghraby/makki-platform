import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mediaRoot } from './lesson/media-storage.util';

const DAY_MS = 24 * 60 * 60 * 1000;
const MULTER_TMP_NAME = /^[a-f0-9]{32}$/;

/**
 * تنظيف دوري لملفات مؤقتة ممكن تتراكم وتملّي القرص لو رفع فيديو اتقطع:
 * ملفات multer المؤقتة (/tmp) ومجلدات التحويل القديمة المتبقية.
 */
@Injectable()
export class MaintenanceService implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceService.name);

  onModuleInit() {
    setTimeout(() => void this.run(), 60_000).unref();
    setInterval(() => void this.run(), 6 * 60 * 60 * 1000).unref();
  }

  private async removeIfOld(target: string, recursive: boolean) {
    try {
      const stat = await fs.promises.stat(target);
      if (Date.now() - stat.mtimeMs < DAY_MS) return;
      await fs.promises.rm(target, { recursive, force: true });
      this.logger.log(`removed stale temp: ${target}`);
    } catch {
      // مش مشكلة — ممكن يكون اتمسح بالفعل.
    }
  }

  async run() {
    try {
      const tmp = os.tmpdir();
      for (const name of await fs.promises.readdir(tmp)) {
        if (MULTER_TMP_NAME.test(name)) {
          await this.removeIfOld(path.join(tmp, name), false);
        } else if (name.startsWith('lesson-')) {
          await this.removeIfOld(path.join(tmp, name), true);
        }
      }

      const lessonsDir = path.join(mediaRoot(), 'lessons');
      if (fs.existsSync(lessonsDir)) {
        for (const id of await fs.promises.readdir(lessonsDir)) {
          await this.removeIfOld(path.join(lessonsDir, id, 'hls-tmp'), true);
        }
      }
    } catch (err) {
      this.logger.warn(`maintenance failed: ${(err as Error).message}`);
    }
  }
}
