import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { B2StorageService } from '../storage/b2-storage.service';
import { AttemptStatus, EnrollmentStatus, NotificationType } from '../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer');

const CERTIFICATE_DOWNLOAD_TTL_SECONDS = 15 * 60;

const CERT_NAVY = '#191c2b';
const CERT_GOLD = '#c9a227';
const CERT_GOLD_DIM = '#b38d20';

// مسارات الخط العربي (Amiri) واللوجو — أصول ثابتة جوه apps/api/assets، مش
// جزء من src فمتحتاجش تتضاف لإعدادات نسخ الأصول بتاعة nest build. بنستخدم
// process.cwd() (مش __dirname) عشان يشتغل صح سواء في وضع التطوير
// (nest start --watch من جوه apps/api) أو الإنتاج (node dist/main).
const CERT_FONT_REGULAR_PATH = path.join(process.cwd(), 'assets', 'fonts', 'Amiri-Regular.ttf');
const CERT_FONT_BOLD_PATH = path.join(process.cwd(), 'assets', 'fonts', 'Amiri-Bold.ttf');
const CERT_LOGO_PATH = path.join(process.cwd(), 'assets', 'certificate', 'logo.png');

function fileToDataUri(filePath: string, mime: string): string {
  const buf = fsSync.readFileSync(filePath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/**
 * الشهادة بتترسم كـ HTML/CSS عادي وبتتحوّل PDF عن طريق متصفح Chromium حقيقي
 * (puppeteer)، عشان النص العربي (تشكيل الحروف المتصلة + اتجاه RTL) يترسم
 * صح 100% — المتصفح بيعمل ده تلقائي من غير أي حيلة يدوية. المحاولة القديمة
 * (pdfkit + arabic-reshaper + bidi-js يدوي) كانت بتطلع الكلام مقلوب/مبعثر
 * فعليًا (اتأكد ده من تقييم حقيقي للناتج)، فاتشالت خالص لصالح الأسلوب ده.
 */
function buildCertificateHtml(data: {
  studentName: string;
  courseTitle: string;
  serialNumber: string;
  issuedAt: Date;
}): string {
  const logoUri = fileToDataUri(CERT_LOGO_PATH, 'image/png');
  const fontRegularUri = fileToDataUri(CERT_FONT_REGULAR_PATH, 'font/ttf');
  const fontBoldUri = fileToDataUri(CERT_FONT_BOLD_PATH, 'font/ttf');

  const issuedDate = data.issuedAt.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Amiri';
    src: url('${fontRegularUri}') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Amiri';
    src: url('${fontBoldUri}') format('truetype');
    font-weight: 700;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    width: 297mm; height: 210mm;
    background: #fdfbf5;
    font-family: 'Amiri', serif;
    direction: rtl;
  }
  .outer {
    position: absolute; inset: 9mm;
    border: 2.5px solid ${CERT_NAVY};
  }
  .inner {
    position: absolute; inset: 3mm;
    border: 1px solid ${CERT_GOLD};
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .band {
    width: 100%;
    height: 26mm;
    background: ${CERT_NAVY};
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .band img { height: 16mm; width: 16mm; object-fit: contain; }
  .title {
    margin-top: 12mm;
    font-size: 34px;
    font-weight: 700;
    color: ${CERT_NAVY};
  }
  .subtitle {
    margin-top: 4mm;
    font-size: 15px;
    color: ${CERT_GOLD_DIM};
  }
  .lead {
    margin-top: 14mm;
    font-size: 14px;
    color: #444;
  }
  .name {
    margin-top: 6mm;
    font-size: 27px;
    font-weight: 700;
    color: ${CERT_NAVY};
  }
  .course-lead {
    margin-top: 8mm;
    font-size: 14px;
    color: #444;
  }
  .course {
    margin-top: 4mm;
    font-size: 20px;
    font-weight: 700;
    color: ${CERT_GOLD_DIM};
  }
  .footer {
    position: absolute;
    bottom: 10mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2mm;
  }
  .footer .divider {
    width: 45mm;
    border-top: 0.75px solid ${CERT_GOLD};
    margin-bottom: 2mm;
  }
  .footer div { font-size: 10.5px; color: #666; }
</style>
</head>
<body>
  <div class="outer"></div>
  <div class="inner">
    <div class="band"><img src="${logoUri}" alt="مكي وشركاؤه" /></div>
    <div class="title">شهادة إتمام</div>
    <div class="subtitle">مكي وشركاؤه — محاماة · استشارات · تأهيل وتدريب</div>
    <div class="lead">تشهد مكي وشركاؤه بأن الطالب/ة</div>
    <div class="name">${data.studentName}</div>
    <div class="course-lead">قد أتم بنجاح كورس/دورة</div>
    <div class="course">${data.courseTitle}</div>
    <div class="footer">
      <div class="divider"></div>
      <div>الرقم التسلسلي: ${data.serialNumber}</div>
      <div>تاريخ الإصدار: ${issuedDate}</div>
    </div>
  </div>
</body>
</html>`;
}

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly b2: B2StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * بتتنادى كل مرة الطالب يخلّص درس (أو ينجح في امتحان). الميثود مسؤولة إنها
   * تتأكد بنفسها إن الطالب فعلاً مستحق الشهادة (كل الدروس المنشورة اتشافت
   * لآخرها + كل الامتحانات المنشورة نجح فيها) قبل ما تصدر حاجة. لو لسه ناقص
   * حاجة بترجع من غير ما تعمل حاجة ومن غير ما ترمي error، عشان النداء عليها
   * بيحصل جوه فلو تحديث تقدّم الدرس ومينفعش يوقفه.
   */
  async tryIssueForCourse(studentId: string, courseId: string): Promise<void> {
    try {
      const existing = await this.prisma.certificate.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
      });
      if (existing) return;

      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
      });
      if (enrollment?.status !== EnrollmentStatus.ACTIVE) return;

      const eligible = await this.isEligible(studentId, courseId);
      if (!eligible) return;

      await this.issue(studentId, courseId);
    } catch (err) {
      // فشل إصدار الشهادة (مشكلة رفع لـ B2 مثلاً) لازم ميكسرش رحلة الطالب —
      // بنسجّل الخطأ بس، والمحاولة الجاية (درس أو امتحان تاني يخلص) هتحاول
      // تصدر الشهادة تاني من الأول.
      this.logger.error(
        `تعذر إصدار شهادة للطالب ${studentId} في الكورس ${courseId}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  async listForStudent(studentId: string) {
    return this.prisma.certificate.findMany({
      where: { studentId },
      include: { course: { select: { id: true, title: true, slug: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  /** للأدمن: نظرة عامة على كل الشهادات الصادرة، مع فلترة اختيارية بالكورس. */
  async adminList(courseId?: string) {
    return this.prisma.certificate.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        student: { select: { id: true, name: true, phone: true } },
        course: { select: { id: true, title: true, track: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getDownloadUrl(certificateId: string, studentId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });
    if (!certificate) throw new NotFoundException('الشهادة مش موجودة');
    if (certificate.studentId !== studentId) {
      throw new ForbiddenException('الشهادة دي مش بتاعتك');
    }
    const url = await this.b2.getPresignedGetUrl(
      certificate.fileStorageKey,
      CERTIFICATE_DOWNLOAD_TTL_SECONDS,
    );
    return { url, expiresInSeconds: CERTIFICATE_DOWNLOAD_TTL_SECONDS };
  }

  private async isEligible(studentId: string, courseId: string): Promise<boolean> {
    const [publishedLessons, completedCount] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId, isPublished: true } }),
      this.prisma.lessonProgress.count({
        where: {
          studentId,
          completed: true,
          lesson: { courseId, isPublished: true },
        },
      }),
    ]);
    // كورس من غير دروس منشورة أصلاً منطقيًا معناه لسه مش جاهز — منصدرش شهادة.
    if (publishedLessons === 0 || completedCount < publishedLessons) return false;

    const publishedExams = await this.prisma.exam.findMany({
      where: { courseId, isPublished: true },
      select: { id: true, passingScore: true },
    });

    for (const exam of publishedExams) {
      const bestAttempt = await this.prisma.examAttempt.findFirst({
        where: {
          examId: exam.id,
          studentId,
          status: AttemptStatus.GRADED,
        },
        orderBy: { score: 'desc' },
      });
      if (!bestAttempt) return false;
      if (exam.passingScore != null && (bestAttempt.score ?? 0) < exam.passingScore) {
        return false;
      }
    }

    return true;
  }

  private async issue(studentId: string, courseId: string) {
    const [student, course] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.prisma.course.findUniqueOrThrow({ where: { id: courseId } }),
    ]);

    const serialNumber = `MK-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const tmpPath = path.join(os.tmpdir(), `certificate-${randomUUID()}.pdf`);

    try {
      await this.renderPdfToFile(tmpPath, {
        studentName: student.name,
        courseTitle: course.title,
        serialNumber,
        issuedAt: new Date(),
      });

      const fileStorageKey = `certificates/${courseId}/${studentId}.pdf`;
      await this.b2.uploadFile(fileStorageKey, tmpPath, 'application/pdf');

      const certificate = await this.prisma.certificate.create({
        data: { studentId, courseId, serialNumber, fileStorageKey },
      });
      await this.notificationService.notifyStudent({
        studentId,
        type: NotificationType.CERTIFICATE_ISSUED,
        title: `شهادتك في "${course.title}" جاهزة`,
        body: `اتصدرت شهادتك برقم ${serialNumber}، تقدر تنزّلها دلوقتي.`,
        link: `/student/certificates`,
      });
      return certificate;
    } finally {
      await fs.rm(tmpPath, { force: true });
    }
  }

  /**
   * بترسم الشهادة كصفحة HTML كاملة (نفس هوية الموقع: كحلي/ذهبي + لوجو مكي)
   * وبتفتحها في متصفح Chromium بدون واجهة (puppeteer) وتصدّرها PDF بمقاس
   * A4 أفقي. المتصفح بيتولى تشكيل الحروف العربية واتجاه RTL بشكل طبيعي —
   * مفيش أي معالجة نص يدوية هنا، وده اللي بيضمن إن النص يطلع صح دايمًا.
   */
  private async renderPdfToFile(
    filePath: string,
    data: {
      studentName: string;
      courseTitle: string;
      serialNumber: string;
      issuedAt: Date;
    },
  ): Promise<void> {
    const html = buildCertificateHtml(data);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.evaluate(() => (document as any).fonts.ready);
      await page.pdf({
        path: filePath,
        width: '297mm',
        height: '210mm',
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      });
    } catch (err) {
      this.logger.error(
        `فشل توليد PDF للشهادة عن طريق puppeteer: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    } finally {
      await browser.close();
    }
  }
}
