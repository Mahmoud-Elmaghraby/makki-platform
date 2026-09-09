import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { B2StorageService } from '../storage/b2-storage.service';

/**
 * بروكسي عام (من غير تسجيل دخول) لصور غلاف الكورسات المرفوعة على B2.
 * مختلف تمامًا عن مسار الفيديو المحمي بتوكن (LessonController) — الصور دي
 * جزء من الموقع التعريفي العام فمفيش داعي لحماية، لكن لازم نسقيها (stream)
 * من عندنا لأن الـ bucket نفسه خاص (مستخدم برضه لفيديوهات محمية)، فمينفعش
 * نديله رابط عام مباشر أو presigned URL (ده أقصى مدة صلاحية ليه 7 أيام
 * بس عند أي S3-compatible storage — مش كفاية لصورة دايمة).
 *
 * المفتاح بييجي base64url (بدل ما يبقى فيه "/" في مسار الراوت) وبيتفك هنا.
 * مقصور على مفاتيح تبدأ بـ "covers/" بس — مش بروكسي عام لأي حاجة على B2.
 */
@Controller('media')
export class MediaController {
  constructor(private readonly b2: B2StorageService) {}

  @Get(':encodedKey')
  async serve(@Param('encodedKey') encodedKey: string, @Res() res: Response) {
    let key: string;
    try {
      key = Buffer.from(encodedKey, 'base64url').toString('utf8');
    } catch {
      throw new NotFoundException('الصورة مش موجودة');
    }

    if (!key.startsWith('covers/')) {
      throw new NotFoundException('الصورة مش موجودة');
    }

    try {
      const { body, contentType } = await this.b2.getObjectStream(key);
      res.setHeader('Content-Type', contentType ?? 'application/octet-stream');
      // الرابط نفسه بيتغيّر (?v=...) كل ما الصورة تتغيّر، فآمن نكاش لسنة كاملة.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      (body as NodeJS.ReadableStream).pipe(res);
    } catch {
      throw new NotFoundException('الصورة مش موجودة');
    }
  }
}
