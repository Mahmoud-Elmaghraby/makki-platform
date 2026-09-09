# المعمارية التقنية — منصة مكي للمحاماة

**آخر تحديث:** 3 سبتمبر 2026

## 1. نظرة عامة على الـ Stack

| الطبقة | التقنية | ملاحظات |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | موجود بالفعل في `makki-platform` |
| Frontend | React + Vite + TypeScript + Tailwind v4 | SPA واحد (مش Next.js) — قرار معماري ثابت اتاخد قبل كده |
| Backend | NestJS (Modular Monolith) | موجود بالفعل، لسه من غير ORM |
| قاعدة البيانات | PostgreSQL + Prisma ORM | **جديد** — هيتضاف كجزء من نقل كود new-mistak |
| الطابور/الـ Jobs | Redis + BullMQ | **جديد** — مخصص لمعالجة الفيديو (transcoding) |
| معالجة الفيديو | ffmpeg (ffmpeg-static + fluent-ffmpeg) → HLS | **جديد** — تحويل لصيغ متعددة الجودة |
| تخزين الملفات | Backblaze B2 (متوافق مع S3) عبر `@aws-sdk/client-s3` | **جديد** |
| CDN | Cloudflare أمام B2 (Bandwidth Alliance = توصيل مجاني) | **جديد** |
| البريد | Resend API | موجود بالفعل في new-mistak (بديل عن Gmail SMTP لإن الـ VPS بيحجب البورت) |
| الدفع | Kashier (مُنفَّذ فعليًا، Sandbox) خلف طبقة تجريد (abstraction) | **جديد ومُنفَّذ** — التفاصيل في قسم 6 و`sprints/sprint-payments.md` |
| النشر (Deployment) | VPS واحد: عملية API + عملية Worker منفصلة (PM2) | نفس نمط new-mistak |

## 2. لماذا Modular Monolith مش Microservices

قرار ثابت من بداية المشروع (موثّق في الـ README الحالي): حجم الفريق والمرحلة الحالية مايستاهلوش تعقيد الـ microservices. كل الموديولات (auth, courses, exams, payments, consulting, cms) بتعيش في نفس تطبيق NestJS، ما عدا **عملية معالجة الفيديو (Worker)** اللي لازم تكون Process منفصل عن الـ API الرئيسي (سبب تقني: تحويل الفيديو بياخد وقت طويل ويستهلك CPU بشكل مكثف، ولو اشتغل جوه نفس عملية الـ API هيبطّئ أو يوقف الطلبات التانية أثناء المعالجة).

## 2.1 أسلوب الكود جوه كل موديول — قرار معماري

اتناقشنا صراحة في النقطة دي: هل نشتغل بأسلوب NestJS البراجماتي المعتاد (زي new-mistak — module/controller/service/dto) ولا Clean Architecture/DDD كاملة بطبقات منفصلة (domain/application/infrastructure/presentation، زي ما هو موجود في مشروع classhub-api بتاع نفس صاحب المشروع)؟

**القرار: النمط البراجماتي، مش Clean Architecture الكاملة.** السبب مش كسل، السبب إن التعقيد الإضافي بتاع الطبقات المنفصلة بيتدفع تمنه لما يبقى فيه منطق بيزنس معقد جدًا وقواعد بتتغير كتير وفريق كبير محتاج حدود صارمة — ومجال الكورسات/الامتحانات/الاشتراكات عندنا أساسًا CRUD + كام state machine واضحة (حالة الامتحان، حالة الدفع)، وده بالظبط اللي new-mistak عالجه كويس من غير طبقات زيادة. وإحنا كمان بنبني على كود جاهز ومكتوب بالأسلوب ده أصلاً (أنظر `reuse-plan.md`)، فتحويله لـ Clean Architecture كاملة معناه إعادة كتابة حاجة شغالة من غير داعي في المرحلة دي.

**عشان القرار ده ميكلفش إعادة بناء لاحقًا لو المشروع كبر، بنلتزم بالقواعد دي من أول يوم:**

1. **Controllers نضيفة دايمًا.** كل منطق البيزنس في الـ services، مفيش قرارات أو حسابات جوه الـ controller.
2. **كل موديول بيكلم موديول تاني عن طريق الـ service بتاعه بس.** ممنوع موديول يوصل لجدول Prisma بتاع موديول تاني مباشرة (مثلاً exams مايوصلش لجدول Payment مباشرة، لازم يعدي على payments module).
3. **أي service فيه منطق حقيقي (مش CRUD بسيط) لازم ياخد `.spec.ts`.** ده اللي بيحمي المنطق وقت أي إعادة هيكلة لاحقة — العادة دي موجودة أصلاً في new-mistak (`exam-attempt.service.spec.ts` وغيره) وهنكمل عليها.
4. **Abstraction (interface/port) بس في الحتت اللي فعلاً متوقع نبدّلها:** بوابة الدفع (`PaymentProvider`) ومزوّد التخزين (`B2StorageService` وراء interface). مفيش تجريد في أي حاجة تانية "احتياطًا".
5. **لو موديول معيّن كبر وتعقّد بعدين**، بنعيد هيكلته هو لوحده (ممكن نستخرج طبقة domain داخلية ليه بس) — من غير ما نلمس باقي الموديولات ولا نعيد بناء المشروع كله. الاختبارات (نقطة 3) هي اللي بتضمن إن إعادة الهيكلة دي متكسرش حاجة.

هذا القرار قابل للمراجعة لموديول واحد بعينه وقت الحاجة، لكنه مش قرار عالمي على المشروع كله من النهاردة.

## 3. نموذج البيانات (Data Model)

المصدر الأساسي: Prisma schema من مشروع new-mistak (مملوك للعميل، منقول بتصريح صريح منه)، بعد حذف الموديلات الخاصة بمجال الدروس الخصوصية (`Booking`, `Group`, `GradeLevel`) وإضافة موديلات جديدة لسد احتياجات مكي.

### 3.1 موديلات منقولة كما هي (مع مراجعة الأسماء فقط)

```prisma
model Course {
  id            String   @id @default(uuid())
  title         String
  slug          String   @unique
  description   String?
  coverImageUrl String?
  isPublished   Boolean  @default(false)
  sections      Section[]
  lessons       Lesson[]
  attachments   Attachment[]
  exams         Exam[]
  enrollments   Enrollment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // === إضافات جديدة لمكي — أنظر قسم 3.2 ===
}

model Section {
  id        String    @id @default(uuid())
  title     String
  order     Int       @default(0)
  course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId  String
  parent    Section?  @relation("SectionChildren", fields: [parentId], references: [id])
  parentId  String?
  children  Section[] @relation("SectionChildren")
  lessons   Lesson[]
  exams     Exam[]
}

model Lesson {
  id              String   @id @default(uuid())
  title           String
  description     String?
  order           Int      @default(0)
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId        String
  section         Section? @relation(fields: [sectionId], references: [id])
  sectionId       String?
  storageKey      String?  // مفتاح ملف الفيديو الأصلي على B2
  videoReady      Boolean  @default(false)
  videoFailed     Boolean  @default(false)
  durationSeconds Int?
  isFreePreview   Boolean  @default(false)
  isPublished     Boolean  @default(false)
  progress        LessonProgress[]
}

model LessonProgress {
  studentId      String
  lessonId       String
  watchedSeconds Int     @default(0)
  completed      Boolean @default(false)
}

model Exam {
  id              String   @id @default(uuid())
  title           String
  courseId        String
  sectionId       String?
  durationMinutes Int?
  passingScore    Int?     // === جديد: حد النجاح لصرف الشهادة ===
  questions       Question[]
  attempts        ExamAttempt[]
}

model Question {
  id              String       @id @default(uuid())
  examId          String
  type            QuestionType // MULTIPLE_CHOICE | TRUE_FALSE | ESSAY
  text            String
  points          Int          @default(1)
  options         Json?
  correctOptionId String?
  correctBoolean  Boolean?
}

model ExamAttempt {
  id          String        @id @default(uuid())
  examId      String
  studentId   String
  status      AttemptStatus // IN_PROGRESS | SUBMITTED | GRADED
  score       Int?
  maxScore    Int?
}

model Enrollment {
  studentId String
  courseId  String
  status    EnrollmentStatus // ACTIVE | REVOKED
}

model Attachment {
  storageKey String
  courseId   String
  sectionId  String?
  lessonId   String?
}

model Student {
  id           String   @id @default(uuid())
  name         String
  phone        String   @unique
  email        String?  @unique
  passwordHash String?
  enrollments  Enrollment[]
  examAttempts ExamAttempt[]
}
```

### 3.2 إضافات جديدة خاصة بمكي

```prisma
// تمييز الكورس عن الدورة على نفس الموديل بدل ما نعمل جدولين منفصلين
enum CourseTrack {
  STUDENT_COURSE   // كورس لطلاب كلية الحقوق
  LAWYER_TRAINING  // دورة للمحامين المتخرجين
}

model Course {
  // ...الحقول الموجودة فوق، بالإضافة لـ:
  track        CourseTrack
  priceEGP     Int          // السعر بالجنيه (أصغر وحدة، أو قرش حسب التفضيل)
  instructor   Instructor?  @relation(fields: [instructorId], references: [id])
  instructorId String?
}

// مدرب/محامي بيقدّم كورسات — منفصل عن جدول Admin User
model Instructor {
  id        String   @id @default(uuid())
  userId    String   @unique // مرتبط بحساب تسجيل دخول في User
  name      String
  bio       String?
  photoUrl  String?
  courses   Course[]
}

// توسيع دور المستخدم الإداري
enum Role {
  ADMIN
  INSTRUCTOR
}
// (الطالب Student جدول منفصل زي ما هو، مش جزء من enum ده)

model Payment {
  id               String        @id @default(uuid())
  student          Student       @relation(fields: [studentId], references: [id])
  studentId        String
  course           Course        @relation(fields: [courseId], references: [id])
  courseId         String
  amountEGP        Int
  provider         PaymentProvider // PAYMOB | KASHIER | ...
  providerRef      String?       // رقم العملية عند البوابة
  status           PaymentStatus // PENDING | PAID | FAILED | REFUNDED
  createdAt        DateTime      @default(now())
  paidAt           DateTime?
}

model Certificate {
  id              String   @id @default(uuid())
  student         Student  @relation(fields: [studentId], references: [id])
  studentId       String
  course          Course   @relation(fields: [courseId], references: [id])
  courseId        String
  serialNumber    String   @unique
  fileStorageKey  String   // ملف الـ PDF على B2
  issuedAt        DateTime @default(now())

  @@unique([studentId, courseId])
}

model ConsultationRequest {
  id        String   @id @default(uuid())
  name      String
  phone     String
  message   String
  status    ConsultationStatus @default(NEW) // NEW | CONTACTED | CLOSED
  createdAt DateTime @default(now())
}
```

### 3.3 أسئلة داخل الفيديو (Video Checkpoints) — إضافة لاحقة بعد Phase 1

راجع `sprints/sprint-video-checkpoints.md` للتفاصيل والدافع الكامل. النموذج:

```prisma
enum CheckpointQuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
}

model VideoCheckpoint {
  id                String                 @id @default(uuid())
  lesson            Lesson                 @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  lessonId          String
  timestampSeconds  Int                    // ثانية ظهور السؤال في الفيديو
  question          String
  type              CheckpointQuestionType
  order             Int                    @default(0)
  options           Json?                  // [{ id, text }] لو MULTIPLE_CHOICE
  correctOptionId   String?
  correctBoolean    Boolean?
  responses         CheckpointResponse[]
}

// إجابة الطالب على سؤال معيّن — upsert واحد لكل (checkpoint, student) عشان
// لو الطالب رجع شاهد الدرس تاني، إجابته الأولى تتحدّث مش تتكرر كصف جديد.
model CheckpointResponse {
  id                String          @id @default(uuid())
  checkpoint        VideoCheckpoint @relation(fields: [checkpointId], references: [id], onDelete: Cascade)
  checkpointId      String
  student           Student         @relation(fields: [studentId], references: [id])
  studentId         String
  selectedOptionId  String?
  booleanAnswer     Boolean?
  isCorrect         Boolean
  answeredAt        DateTime        @default(now())

  @@unique([checkpointId, studentId])
}
```

فرق جوهري عن `Exam`/`Question`: مفيش `points` ولا `passingScore` — السؤال ده
مش جزء من تقييم رسمي، والإجابة (صح أو غلط) لا توقف تقدم الطالب في الكورس ولا
تمنعه من إكمال الفيديو.

## 4. نظام الفيديو — منقول بالكامل من new-mistak

هذا هو الجزء اللي راجعته بالتفصيل وأكدت إنه سليم معماريًا:

1. **الرفع (Upload):** الأدمن/المدرب بيرفع الفيديو مباشرة من المتصفح لـ B2 عن طريق presigned PUT URL (الفيديو ماعديش على السيرفر بتاعنا خالص أثناء الرفع، توفير في الباندويدث).
2. **المعالجة (Transcode):** بمجرد ما الرفع يخلص، بيتحط Job في طابور BullMQ. عملية Worker منفصلة تمامًا عن الـ API بتلقط الفيديو، تعمله probe (تعرف الجودة الأصلية)، تحوّله لعدة جودات (renditions) بصيغة HLS عن طريق ffmpeg، وترفع الناتج على B2.
3. **الحماية والعرض (Playback):** الطالب لما يفتح درس، السيرفر بيتحقق إن عنده اشتراك (`Enrollment.status = ACTIVE`) قبل ما يديله أي حاجة، وبعدين بيديله توكن JWT موقّع صالح لمدة 4 ساعات (كفاية لمشاهدة كاملة مع وقف/رجوع). كل طلب للـ manifest أو أجزاء الفيديو (segments) بيتحقق من التوكن ده. الدروس المعلّمة "معاينة مجانية" بس اللي بتتفتح من غير اشتراك.
4. **التتبع (Progress):** الفرونت إند بيبعت موضع المشاهدة كل 15 ثانية للسيرفر، وده اللي بيحسب نسبة الإكمال ويقرر هل الدرس "مكتمل" ولا لأ (حد افتراضي: 90% من مدة الفيديو).

**التكلفة المتوقعة:** تخزين B2 حوالي 0.005$ للجيجا شهريًا، والتوصيل عن طريق Cloudflare (Bandwidth Alliance) مجاني بالكامل — يعني أرخص حتى من الحلول اللي قارناها زي Bunny/R2، ومفيش أي اشتراك شهري لخدمة خارجية لإن الكود عندنا جاهز أصلاً.

## 5. الفرق بين new-mistak ومكي على مستوى الفرونت إند

new-mistak فرونت إنده Next.js (App Router + Server Actions). مكي قرر يكون React+Vite SPA. يعني:

- **هننقل:** منطق الـ UX والتصميم التفاعلي (خطوات رفع الفيديو مع progress bar، مشغّل الفيديو بـ hls.js، شجرة الأقسام القابلة للطي، تدفق أخذ الامتحان).
- **هنغيّر:** كل Server Action (زي `createLessonAction`) بيتحول لطلب API عادي (fetch/axios) بيتكلم مع نفس الـ endpoint في NestJS. مفيش منطق سيرفري في الفرونت إند خالص، كل حاجة بتعدي على الـ API.
- **هنعيد تصميمه بالكامل بصريًا:** الألوان والخطوط في new-mistak (navy/amber) خاصة بيه، مكي هيكون له هوية بصرية منفصلة تمامًا.

## 6. الدفع — طبقة التجريد (Abstraction) — مُنفَّذ

القرار اتاخد وتم التنفيذ فعليًا (راجع `sprints/sprint-payments.md` للتفاصيل
والدافع). الـ interface اسمه **`PaymentGateway`** — عمدًا مش `PaymentProvider`
عشان الاسم ده محجوز أصلاً لـ enum بتاع Prisma (`Payment.provider`) وكان
هيتعارض:

```typescript
interface PaymentGateway {
  createCheckoutSession(payment: Payment): Promise<{ redirectUrl: string }>;
  verifyWebhookSignature(payload: unknown, headers: unknown): boolean;
  parseWebhookEvent(payload: unknown): { providerRef: string; status: 'PAID' | 'FAILED' };
}
```

أول تنفيذ فعلي: `KashierProvider` (`apps/api/src/payments/providers/kashier.provider.ts`)،
شغّال على Sandbox. `PaymobProvider` أو أي بوابة تانية تتضاف بسهولة بعدين
(implement للـ interface بس) من غير ما تأثر على `payments.service.ts` أو
`payments.controller.ts`. لسه مطلوب من العميل: حساب Kashier Sandbox حقيقي
(`KASHIER_MERCHANT_ID` و`KASHIER_API_KEY` في `.env` لسه فاضيين) عشان نتأكد من
شكل رابط الـ checkout بالظبط ونختبر الفلو كامل (تفاصيل في ملف السبرينت).

## 7. البيئة والنشر (Environment & Deployment)

متغيرات بيئة جديدة مطلوبة (إضافة لما هو موجود):

```
DATABASE_URL=
REDIS_URL=
B2_APPLICATION_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=
B2_REGION=
B2_CDN_BASE_URL=
API_PUBLIC_URL=
JWT_SECRET=
RESEND_API_KEY=
PAYMENT_PROVIDER=          # kashier (paymob ممكن يتضاف بعدين)
KASHIER_MERCHANT_ID=
KASHIER_API_KEY=
KASHIER_MODE=              # test | live
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=
```

النشر: نفس نمط new-mistak — عملية PM2 للـ API، وعملية PM2 منفصلة للـ Worker (`pnpm run start:worker`)، على نفس الـ VPS في المرحلة الحالية (ممكن ننقل الـ Worker لسيرفر منفصل لاحقًا لو حمل المعالجة زاد).

## 8. مرجع

- المتطلبات الوظيفية الكاملة: `prd.md`
- تفاصيل إعادة استخدام كود new-mistak (ملف بملف): `reuse-plan.md`
- خطة المراحل: `roadmap.md`
- سجل قرارات وتفاصيل تنفيذ كل سبرينت (الدفع، بوابة الطالب، أسئلة الفيديو): مجلد `sprints/`
