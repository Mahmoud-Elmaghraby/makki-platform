import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// تخزين الفيديو محليًا على السيرفر (بدل B2): ملفات HLS بتتخزن على القرص
// وnginx بيقدّم المقاطع (.ts) مباشرة بروابط موقّعة ومؤقتة (secure_link).
// الوضع ده بيتفعّل تلقائيًا لما المجلد ده يتوجد (بيتعمل بسكريبت
// scripts/setup-media.sh)، وغير كده النظام بيفضل على B2 زي ما كان.
const DEFAULT_MEDIA_ROOT = '/var/www/makki-media/media';

export function mediaRoot(): string {
  return process.env.MEDIA_ROOT || DEFAULT_MEDIA_ROOT;
}

export function isLocalMediaEnabled(): boolean {
  return Boolean(process.env.MEDIA_ROOT) || fs.existsSync(DEFAULT_MEDIA_ROOT);
}

export function lessonMediaDir(lessonId: string): string {
  return path.join(mediaRoot(), 'lessons', lessonId);
}

export function localHlsFile(lessonId: string, ...parts: string[]): string {
  return path.join(lessonMediaDir(lessonId), 'hls', ...parts);
}

// نفس السر لازم يتحسب في scripts/setup-media.sh (HMAC-SHA256 على JWT_SECRET).
function mediaSigningSecret(): string {
  const jwtSecret = process.env.JWT_SECRET as string;
  return crypto.createHmac('sha256', jwtSecret).update('media-v1').digest('hex');
}

function mediaPublicBase(): string {
  if (process.env.MEDIA_PUBLIC_URL) return process.env.MEDIA_PUBLIC_URL.replace(/\/$/, '');
  return new URL(process.env.API_PUBLIC_URL as string).origin;
}

/** رابط مقطع موقّع بصيغة nginx secure_link_md5 "$secure_link_expires$uri SECRET". */
export function signMediaUrl(relativePath: string, ttlSeconds: number): string {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const uri = `/media/${relativePath}`;
  const signature = crypto
    .createHash('md5')
    .update(`${expires}${uri} ${mediaSigningSecret()}`)
    .digest('base64url');
  return `${mediaPublicBase()}${uri}?e=${expires}&s=${signature}`;
}

export async function moveFile(from: string, to: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(to), { recursive: true });
  try {
    await fs.promises.rename(from, to);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
    await fs.promises.copyFile(from, to);
    await fs.promises.unlink(from);
  }
}

/** المساحة الفاضية (بالبايت) على القرص اللي فيه مجلد الميديا. */
export async function freeMediaBytes(): Promise<number> {
  await fs.promises.mkdir(mediaRoot(), { recursive: true });
  const s = await fs.promises.statfs(mediaRoot());
  return Number(s.bavail) * Number(s.bsize);
}
