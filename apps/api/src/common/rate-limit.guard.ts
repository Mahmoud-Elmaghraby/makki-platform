import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

// حارس بسيط في الذاكرة (من غير مكتبات خارجية) لتحديد عدد محاولات
// تسجيل الدخول/التسجيل. ملاحظات تصميم مهمة:
// - الحد الأساسي بيكون على "المعرّف" (إيميل/رقم تليفون) مش على الـ IP،
//   لأن شبكات المحمول في مصر بتشارك IP واحد بين مئات المستخدمين (CGNAT)،
//   فلو حددنا الـ IP بشكل صارم هنقفل على طلاب أبرياء.
// - حد الـ IP عالي عمدًا (حماية من الإغراق مش من التخمين).
// - لو مقدرناش نحدد الـ IP بثقة بنتجاهل حد الـ IP بدل ما نحط الكل في سلة واحدة.
// - بيتصفّر مع كل إعادة تشغيل للـ API (مقبول).

export interface RateLimitOptions {
  /** أقصى محاولات لنفس المعرّف (إيميل/تليفون) في النافذة. */
  perIdentifier: number;
  /** أقصى محاولات لنفس الـ IP في النافذة (عالي عمدًا). */
  perIp: number;
  windowSeconds: number;
  /** اسم الحقل في body اللي بيمثّل المعرّف. */
  identifierField: string;
}

const RATE_LIMIT_KEY = 'rate-limit-options';
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();

function hit(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  existing.count += 1;
  if (existing.count > limit) return Math.ceil((existing.resetAt - now) / 1000);
  return null;
}

function clientIp(req: Request): string | null {
  // nginx بيضيف الـ IP الحقيقي في آخر خانة من X-Forwarded-For، وأول خانة
  // ممكن يكون العميل نفسه كاتبها (تزوير) فبناخد الأخيرة.
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff.join(',') : xff;
  if (raw) {
    const last = raw.split(',').pop()?.trim();
    if (last) return last;
  }
  const real = req.headers['x-real-ip'];
  return typeof real === 'string' && real ? real : null;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const route = `${req.method}:${req.path}`;
    const windowMs = options.windowSeconds * 1000;
    const identifier = String(
      (req.body as Record<string, unknown> | undefined)?.[options.identifierField] ?? '',
    )
      .trim()
      .toLowerCase();

    let retryAfter: number | null = null;
    if (identifier) {
      retryAfter = hit(`${route}:id:${identifier}`, options.perIdentifier, windowMs);
    }
    const ip = clientIp(req);
    if (retryAfter === null && ip) {
      retryAfter = hit(`${route}:ip:${ip}`, options.perIp, windowMs);
    }

    if (retryAfter !== null) {
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      const res = context.switchToHttp().getResponse<{ setHeader: (k: string, v: string) => void }>();
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        `محاولات كتير جدًا، جرّب تاني بعد ${minutes} دقيقة.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
