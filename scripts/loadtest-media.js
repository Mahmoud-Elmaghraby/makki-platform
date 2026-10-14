#!/usr/bin/env node
// اختبار تحميل لتقديم مقاطع الفيديو (nginx + القرص) — يتشغّل على السيرفر نفسه.
//   node scripts/loadtest-media.js [عدد المشاهدين المتزامنين=50] [المدة بالثواني=30]
// بيعمل روابط موقّعة حقيقية لمقاطع درس موجود ويحمّلها بأقصى سرعة، وبيحسب
// كام مشاهد متزامن السيرفر يقدر يخدّمهم (كل مشاهد ≈ 1.6 ميجابت/ث).
// ملحوظة: الطلبات بتطلع من السيرفر لنفسه، فبتختبر nginx والقرص والمعالج،
// مش سرعة كارت الشبكة الخارجية. شغّله في وقت هادي.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const concurrency = Number(process.argv[2] || 50);
const durationSec = Number(process.argv[3] || 30);
const ROOT = '/var/www/makki-media/media/lessons';
const ENVFILE = '/var/www/makki-platform/apps/api/.env';
const BASE = process.env.BASE_URL || 'https://mekkylaw.com';
const STREAM_MBPS = 1.6;

function readEnv(key) {
  const line = fs.readFileSync(ENVFILE, 'utf8').split('\n').find((l) => l.startsWith(key + '='));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : '';
}

const jwt = readEnv('JWT_SECRET');
if (!jwt) { console.error('JWT_SECRET مش موجود'); process.exit(1); }
const secret = crypto.createHmac('sha256', jwt).update('media-v1').digest('hex');

function sign(rel) {
  const expires = Math.floor(Date.now() / 1000) + 600;
  const uri = `/media/${rel}`;
  const sig = crypto.createHash('md5').update(`${expires}${uri} ${secret}`).digest('base64url');
  return `${BASE}${uri}?e=${expires}&s=${sig}`;
}

// دوّر على درس فيه مقاطع
const segments = [];
for (const lesson of fs.existsSync(ROOT) ? fs.readdirSync(ROOT) : []) {
  const hls = path.join(ROOT, lesson, 'hls');
  if (!fs.existsSync(hls)) continue;
  for (const variant of fs.readdirSync(hls)) {
    const dir = path.join(hls, variant);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (/^seg_\d+\.ts$/.test(f)) segments.push(`lessons/${lesson}/hls/${variant}/${f}`);
    }
  }
  if (segments.length >= 3) break;
}
if (segments.length < 3) { console.error('مفيش درس فيه مقاطع على القرص — ارفع فيديو الأول'); process.exit(1); }

const latencies = [];
let bytes = 0, ok = 0, errors = 0;
const stopAt = Date.now() + durationSec * 1000;

async function viewer(i) {
  let n = i;
  while (Date.now() < stopAt) {
    const rel = segments[n++ % segments.length];
    const t0 = performance.now();
    try {
      const res = await fetch(sign(rel));
      if (!res.ok) { errors++; await res.arrayBuffer().catch(() => {}); continue; }
      const buf = await res.arrayBuffer();
      bytes += buf.byteLength; ok++;
      latencies.push(performance.now() - t0);
    } catch { errors++; }
  }
}

(async () => {
  console.log(`بدء: ${concurrency} مشاهد متزامن لمدة ${durationSec}ث على ${segments.length} مقطع...`);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: concurrency }, (_, i) => viewer(i)));
  const secs = (Date.now() - t0) / 1000;
  latencies.sort((a, b) => a - b);
  const p = (q) => (latencies[Math.floor(latencies.length * q)] || 0).toFixed(0);
  const mbps = (bytes * 8) / 1e6 / secs;
  console.log('--- النتيجة ---');
  console.log(`طلبات ناجحة: ${ok} | أخطاء: ${errors}`);
  console.log(`الإنتاجية: ${mbps.toFixed(0)} ميجابت/ث`);
  console.log(`زمن الاستجابة: متوسط p50=${p(0.5)}ms  p95=${p(0.95)}ms  p99=${p(0.99)}ms`);
  console.log(`يقدر يخدّم تقريبًا: ${Math.floor(mbps / STREAM_MBPS)} مشاهد متزامن (على مستوى nginx والقرص)`);
  console.log(`load average بعد الاختبار: ${os.loadavg().map((x) => x.toFixed(2)).join(' ')}`);
  if (errors > 0) console.log('تنبيه: فيه أخطاء — لو 429/403 يبقى ده من الإعدادات، ابعتلي الناتج.');
})();
