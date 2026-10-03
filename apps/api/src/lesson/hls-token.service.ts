import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// سقف أقصى مطلق لصلاحية رابط الفيديو (كان ده التوكن الوحيد قبل كده) — بنفضل
// نستخدمه كحد أقصى لأي درس، حتى لو مدته غير معروفة أو طويلة جدًا.
export const MAX_PLAYBACK_SESSION_TTL_SECONDS = 4 * 60 * 60;
// حد أدنى معقول (نص ساعة) — عشان أي درس قصير جدًا أو لسه من غير durationSeconds
// محسوبة يفضل عنده وقت كافي يتفرّج ويرجع لورا من غير ما الرابط ينتهي فجأة.
export const MIN_PLAYBACK_SESSION_TTL_SECONDS = 30 * 60;
// هامش إضافي فوق مدة الدرس نفسها (يسمح بإيقاف مؤقت، رجوع لورا، إعادة مشاهدة
// جزء) من غير ما نسيب الرابط صالح لساعات بعد ما الطالب خلّص الدرس فعليًا —
// وده اللي بيقلل "نافذة" سرقة اللينكات المؤقتة بعد انتهاء المشاهدة.
const DURATION_BUFFER_SECONDS = 20 * 60;

interface HlsManifestPayload {
  lessonId: string;
}

/**
 * بيحسب أقرب صلاحية معقولة لجلسة مشاهدة درس معيّن بدل ما نفضل مثبّتينها على
 * 4 ساعات لكل الدروس مهما كانت مدتها — درس 15 دقيقة كان بياخد نفس صلاحية
 * درس ساعتين، وده بيوسّع نافذة استخدام اللينك المسروق من غير داعي.
 */
export function computeSessionTtlSeconds(durationSeconds?: number | null): number {
  if (!durationSeconds || durationSeconds <= 0) {
    return MAX_PLAYBACK_SESSION_TTL_SECONDS;
  }
  const target = durationSeconds + DURATION_BUFFER_SECONDS;
  return Math.min(
    MAX_PLAYBACK_SESSION_TTL_SECONDS,
    Math.max(MIN_PLAYBACK_SESSION_TTL_SECONDS, target),
  );
}

@Injectable()
export class HlsTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(lessonId: string, ttlSeconds: number = MAX_PLAYBACK_SESSION_TTL_SECONDS): Promise<string> {
    return this.jwtService.signAsync(
      { lessonId } satisfies HlsManifestPayload,
      { expiresIn: ttlSeconds },
    );
  }

  verify(token: string): Promise<HlsManifestPayload> {
    return this.jwtService.verifyAsync<HlsManifestPayload>(token);
  }
}
