# خطة إعادة استخدام كود مشروع new-mistak

**آخر تحديث:** 2 سبتمبر 2026
**ملكية الكود:** مشروع new-mistak ملك لمحمود (صاحب المشروع)، وأكد صراحة إن له الحق يستخدم كوده في أي مشروع تاني بما فيه مكي.
**مكان المشروع المصدر:** `C:\Projects\new-mistak` (مش `M:\Projects\new-mistak` — ده مشروع تاني مختلف تمامًا واسمه اتكرر بالصدفة، شوف ملاحظة في آخر الملف).

## 1. لماذا نستخدمه

new-mistak أصلاً منصة لحجز دروس خصوصية (تقوية)، لكن في آخر تحديثين للمشروع (commits: "Add student platform backend" و"Add student portal and admin course management UI") اتضاف فيه نظام LMS كامل: كورسات، أقسام، دروس فيديو، امتحانات، تسجيل/اشتراك، تتبع تقدم — وده يطابق 80% من احتياج مكي في مجال الكورسات/الدورات.

تمت مراجعة الكود الفعلي (مش بس أسماء الملفات) لملفات: `b2-storage.service.ts`, `transcode.processor.ts`, `worker.ts`, `hls-token.service.ts`, `hls-manifest-token.guard.ts`, `lesson.service.ts`, `exam-attempt.service.ts` بالكامل. التقييم: كود احترافي، فيه فحص صلاحيات حقيقي (مش شكلي)، state machine محكم للامتحانات، وتعليقات توضح قرارات هندسية واعية (مش كود مولّد بدون تفكير).

## 2. جدول إعادة الاستخدام

### 2.1 Backend — يُنقل مع تعديلات بسيطة (أسماء/تنظيف)

| الموديول في new-mistak | القرار | ملاحظات |
|---|---|---|
| `storage/b2-storage.service.ts` | ✅ ينقل كما هو | لا تغيير مطلوب |
| `transcode/*` (processor, queue, ffmpeg-hls.util) | ✅ ينقل كما هو | لا تغيير مطلوب |
| `worker.ts` | ✅ ينقل كما هو | نفس نمط PM2 |
| `lesson/*` (module, service, controller, hls-token, guards) | ✅ ينقل مع إضافة | إضافة فحص Certificate eligibility بعد كل تحديث progress |
| `exam/*`, `exam-attempt.service.ts` | ✅ ينقل مع إضافة | إضافة `passingScore` على Exam + وصل النتيجة بصرف الشهادة |
| `enrollment/*` | ✅ ينقل مع إضافة | الاشتراك يتفعّل عن طريق webhook دفع بدل ما يتضاف يدوي فقط |
| `attachment/*` | ✅ ينقل كما هو | لا تغيير مطلوب |
| `section/*` | ✅ ينقل كما هو | لا تغيير مطلوب |
| `student/*` (auth, guards, strategies) | ✅ ينقل كما هو | نظام مصادقة الطالب منفصل عن الأدمن، بيفضل كده |
| `notification/*` | ✅ ينقل كما هو | Resend للإيميل، يتوسع لاحقًا لإشعارات طلبات الاستشارة |
| `reports/*` | ✅ ينقل كأساس | يتوسع بتقارير مبيعات/اشتراكات خاصة بمكي |
| `prisma/schema.prisma` | ⚠️ ينقل جزئيًا | تُحذف `Booking`, `Group`, `GradeLevel`؛ تُضاف `Payment`, `Certificate`, `ConsultationRequest`, `Instructor`, `CourseTrack` |
| `course/*` | ⚠️ ينقل مع إضافة | إضافة `track`, `priceEGP`, `instructorId` |
| `booking/*`, `group/*`, `grade-level/*` | ❌ لا يُنقل | خاص بمجال حجز الدروس الخصوصية، مالوش لازمة عند مكي |

### 2.2 Backend — جديد بالكامل

- `payments/*` — موديول جديد بالكامل (new-mistak مفيهوش أي نظام دفع خالص)، مبني على طبقة التجريد الموصوفة في `technical-architecture.md`.
- `consulting/*` — موديول جديد بسيط (نموذج + inbox)، مبني على نمط `notification` الموجود.
- `certificate/*` — موديول جديد: توليد PDF + منطق التحقق من استيفاء شروط الإصدار.
- توسيع `auth` (حسابات الأدمن/المدرب) عشان يفرّق بين `ADMIN` و`INSTRUCTOR` ويطبّق الصلاحيات المقيّدة للمدرب (يشوف ويعدّل بس على الكورسات اللي هو `instructorId` بتاعها).

### 2.3 Frontend — يُنقل كتصميم/منطق مش كملفات حرفية

الفرونت إند بتاع new-mistak Next.js، ومكي Vite SPA — فمفيش نقل ملفات حرفي هنا. اللي بيتنقل هو **نمط التفاعل**:

| المكوّن في new-mistak | الاستفادة في مكي |
|---|---|
| `LessonUploader.tsx` | نفس تدفق الرفع (presigned PUT + progress bar + polling لحالة المعالجة)، لكن بيتكتب كمكوّن React عادي بيكلم API عن طريق fetch بدل server actions |
| `StreamPlayer.tsx` | نفس المنطق بالظبط (hls.js + دعم Safari الأصلي + تتبع التقدم كل 15 ثانية) — قابل للنقل شبه حرفي لإنه أصلاً client component عادي |
| `SectionTree.tsx` / `CourseTree.tsx` | نفس فكرة العرض الشجري للأقسام والدروس |
| `AttachmentUploader.tsx` | نفس تدفق رفع المرفقات |
| صفحات الأدمن (`admin/(dashboard)/courses/...`) | نفس تقسيم الشاشات (قائمة كورسات → كورس واحد → أقسام/دروس/امتحانات/اشتراكات/تقارير) |
| صفحات بوابة الطالب (`portal/courses/...`) | نفس تقسيم الشاشات (كورساتي → كورس → دروس/امتحانات) |

التصميم البصري (الألوان، الخطوط، الهوية) هيتعمل من الصفر بالكامل بهوية مكي، مفيش أي نقل بصري من new-mistak.

## 3. ملاحظة مهمة: فيه مشروعين اسمهم "new-mistak"

أثناء البحث لقينا مجلد `M:\Projects\new-mistak` وهو **مشروع تاني مختلف تمامًا** (نظام حجز دروس خصوصية بسيط بدون أي فيديو أو كورسات — Prisma schema بتاعه فيه Student/GradeLevel/Group/Booking بس). المشروع الصحيح اللي فيه نظام الفيديو والكورسات هو `C:\Projects\new-mistak`. لو حصل لبس في المستقبل، ده هو الفرق.

## 4. مرجع

- المتطلبات الوظيفية: `prd.md`
- المعمارية التقنية والـ schema الكامل: `technical-architecture.md`
- خطة المراحل الزمنية: `roadmap.md`
