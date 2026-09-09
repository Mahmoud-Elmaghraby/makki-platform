# تشغيل المشروع محليًا — Phase 0 + Phase 1

هذا الدليل لتشغيل الكود اللي اتكتب في Phase 0 و Phase 1 على جهازك. نفّذ الخطوات
دي من التيرمينال العادي بتاعك (مش من خلال Claude) لأن تحميل محرك Prisma محتاج
اتصال إنترنت مباشر.

## تشغيل سريع (بعد ما تعمل خطوات الإعداد لأول مرة تحت)

لو already عملت خطوات 1-4 تحت قبل كده (تثبيت، Prisma، حساب أدمن)، تقدر بعد
كده تشغّل كل حاجة (API + Worker + الفرونت إند) بأمر واحد بدل ما تفتح 3
تيرمينالات يدويًا كل مرة:

```powershell
.\dev.ps1
```

السكريبت بيتأكد الأول إن Postgres وRedis شغالين، وبعدين بيفتح 3 نوافذ
PowerShell منفصلة (API، Worker، الفرونت إند). لو ظهرت رسالة عن "execution
policy"، شغّل مرة واحدة بس: `Set-ExecutionPolicy -Scope CurrentUser
RemoteSigned`.

## 1) المتطلبات

- Node.js 20+، pnpm
- PostgreSQL شغّال محليًا (أو أي instance تانية) — اعمل قاعدة بيانات فاضية اسمها
  `makki_dev` مثلًا
- Redis شغّال محليًا (لطابور تحويل الفيديو)
- حساب Backblaze B2 (لو عايز تجرب رفع فيديو فعليًا — اختياري في الأول)

## 2) تثبيت الباكدجات

```bash
pnpm install
```

## 3) إعداد قاعدة البيانات (Prisma)

عدّل `apps/api/.env` وحط `DATABASE_URL` بتاعك، وبعدين:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

## 4) عمل أول حساب أدمن

عدّل `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` في `apps/api/.env` لو حابب،
وبعدين من جوه `apps/api`:

```bash
pnpm seed:admin
```

## 5) تشغيل السيرفرات (3 تيرمينالات منفصلة)

```bash
# Terminal 1 — الـ API
cd apps/api
pnpm start:dev

# Terminal 2 — عامل تحويل الفيديو (لازم Redis شغّال)
cd apps/api
pnpm worker

# Terminal 3 — الفرونت إند
cd apps/frontend
pnpm dev
```

## 6) الدخول على لوحة التحكم

افتح `http://localhost:5173/admin/login` وسجّل دخول ببيانات الأدمن اللي عملتها
في الخطوة 4.

## 7) رفع الفيديو (B2)

لو عايز تجرب رفع فيديو فعليًا، لازم:
1. تعبي `B2_*` variables في `apps/api/.env` ببيانات الـ bucket بتاعك.
2. تضيف CORS rule على الـ bucket نفسه يسمح بـ `PUT` من `http://localhost:5173`
   (وبعدين من دومين الموقع الحقيقي وقت النشر) — من غيرها المتصفح هيرفض طلب
   الرفع المباشر لـ B2 حتى لو الرابط الموقّع (presigned URL) صحيح.

من غير إعداد B2، تقدر تعمل كل حاجة تانية في اللوحة (كورسات، أقسام، امتحانات،
مدربين، طلاب) عادي — بس رفع الفيديو نفسه هيفشل لحد ما الـ bucket يتظبط.
