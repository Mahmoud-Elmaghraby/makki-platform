import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from './prisma/prisma.service';

const MIN_FREE_DISK_PERCENT = 10;

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return { status: 'ok', service: 'makki-api' };
  }

  /**
   * فحص صحة للمراقبة الخارجية (UptimeRobot مثلًا): بيرجّع 503 لو قاعدة
   * البيانات واقعة أو المساحة الفاضية على القرص أقل من 10%، فالمراقب
   * يبعتلك إيميل قبل ما الفيديو أو الموقع يقف.
   */
  async getDetailedHealth() {
    let db = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = false;
    }

    let diskFreePercent = -1;
    try {
      const s = await fs.promises.statfs('/');
      diskFreePercent = Math.round((Number(s.bavail) / Number(s.blocks)) * 100);
    } catch {
      // مش قادرين نقرا المساحة — منعتبرش ده فشل بحد ذاته.
    }

    const diskOk = diskFreePercent === -1 || diskFreePercent >= MIN_FREE_DISK_PERCENT;
    const body = { status: db && diskOk ? 'ok' : 'degraded', db, diskFreePercent };
    if (!db || !diskOk) throw new ServiceUnavailableException(body);
    return body;
  }
}
