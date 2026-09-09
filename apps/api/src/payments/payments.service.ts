import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { KashierProvider } from './providers/kashier.provider';
import { PaymentGateway } from './payment-gateway.interface';
import {
  EnrollmentStatus,
  PaymentProvider as PaymentProviderEnum,
  PaymentStatus,
} from '../generated/prisma/enums';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../generated/prisma/enums';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentService: EnrollmentService,
    private readonly kashier: KashierProvider,
    private readonly notificationService: NotificationService,
  ) {}

  async initiateCheckout(studentId: string, courseId: string) {
    const [student, course] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: studentId } }),
      this.prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!student) throw new NotFoundException('الطالب مش موجود');
    if (!course || !course.isPublished) throw new NotFoundException('الكورس مش موجود');

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existingEnrollment?.status === EnrollmentStatus.ACTIVE) {
      throw new ConflictException('انت مشترك في الكورس ده بالفعل');
    }

    const payment = await this.prisma.payment.create({
      data: {
        studentId,
        courseId,
        amountEGP: course.priceEGP,
        provider: PaymentProviderEnum.KASHIER,
        status: PaymentStatus.PENDING,
      },
    });

    const { redirectUrl } = await this.kashier.createCheckoutSession({
      paymentId: payment.id,
      amountEGP: payment.amountEGP,
      studentName: student.name,
      studentEmail: student.email,
    });

    return { paymentId: payment.id, redirectUrl };
  }

  async getStatus(paymentId: string, studentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.studentId !== studentId) {
      throw new NotFoundException('الدفعة مش موجودة');
    }
    return { status: payment.status, courseId: payment.courseId };
  }

  async handleKashierWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    return this.processWebhook(this.kashier, payload, headers);
  }

  private async processWebhook(
    gateway: PaymentGateway,
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const isValid = gateway.verifyWebhookSignature(payload, headers);
    if (!isValid) {
      this.logger.warn('webhook بتوقيع غلط أو ناقص — اتجاهل');
      return { ignored: true };
    }

    const event = gateway.parseWebhookEvent(payload);
    const payment = await this.prisma.payment.findUnique({
      where: { id: event.merchantOrderId },
    });
    if (!payment) {
      this.logger.warn(`webhook بيتكلم عن دفعة مش موجودة عندنا: ${event.merchantOrderId}`);
      return { ignored: true };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return { alreadyProcessed: true };
    }

    if (event.status === 'PAID') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, providerRef: event.providerRef, paidAt: new Date() },
      });
      try {
        await this.enrollmentService.adminEnroll({
          studentId: payment.studentId,
          courseId: payment.courseId,
        });
      } catch (err) {
        this.logger.warn(
          `تعذر تفعيل الاشتراك تلقائيًا بعد الدفع ${payment.id} (ممكن يكون مفعّل بالفعل)`,
          err instanceof Error ? err.message : String(err),
        );
      }
      const [student, course] = await Promise.all([
        this.prisma.student.findUnique({ where: { id: payment.studentId } }),
        this.prisma.course.findUnique({ where: { id: payment.courseId } }),
      ]);
      await this.notificationService.notifyAdmin({
        type: NotificationType.PAYMENT_RECEIVED,
        title: `دفعة جديدة: ${payment.amountEGP} جنيه من ${student?.name ?? ''}`,
        body: `الكورس: ${course?.title ?? ''} — عن طريق Kashier`,
        link: `/admin/payments`,
      });
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, providerRef: event.providerRef },
      });
    }

    return { processed: true };
  }

  /**
   * قائمة المدفوعات للوحة الأدمن — بفلترة اختيارية بالحالة والكورس، مع
   * بيانات الطالب/الكورس المختصرة اللازمة للعرض بس (مش الكائن كامل).
   */
  async adminList(filters: { status?: PaymentStatus; courseId?: string }) {
    return this.prisma.payment.findMany({
      where: {
        status: filters.status,
        courseId: filters.courseId,
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        course: { select: { id: true, title: true, track: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * إحصائيات مجمّعة للوحة الأدمن: إجمالي الإيرادات (المدفوعات الناجحة بس)،
   * إيرادات آخر 30 يوم، وعدد كل حالة دفع. الحساب بيتم في قاعدة البيانات
   * (groupBy/aggregate) مش بجلب كل الصفوف وحسابها في الفرونت اند.
   */
  async adminStats() {
    const [totalPaidAgg, last30DaysPaidAgg, statusCounts] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amountEGP: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { amountEGP: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const countsByStatus: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      FAILED: 0,
      REFUNDED: 0,
    };
    for (const row of statusCounts) {
      countsByStatus[row.status] = row._count;
    }

    return {
      totalRevenueEGP: totalPaidAgg._sum.amountEGP ?? 0,
      totalPaidCount: totalPaidAgg._count,
      last30DaysRevenueEGP: last30DaysPaidAgg._sum.amountEGP ?? 0,
      last30DaysPaidCount: last30DaysPaidAgg._count,
      countsByStatus,
    };
  }

  /**
   * تسجيل دفعة استلمت يدوي (فودافون كاش أو أي طريقة تحويل خارج المنصة) بعد
   * ما الأدمن/المدير يتأكد من وصول الفلوس. بيفعّل الاشتراك الأول (وده اللي
   * ممكن يرمي خطأ لو الطالب مشترك بالفعل — نحب كده، عشان منسجّلش دفعة لغلطة
   * إدخال متكرر)، وبعدين يسجّل الدفعة نفسها كـ PAID مربوطة بيه.
   */
  async adminRecordManualPayment(dto: RecordManualPaymentDto) {
    const [student, course] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    ]);
    if (!student) throw new NotFoundException('الطالب مش موجود');
    if (!course) throw new NotFoundException('الكورس مش موجود');

    const enrollment = await this.enrollmentService.adminEnroll({
      studentId: dto.studentId,
      courseId: dto.courseId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        courseId: dto.courseId,
        amountEGP: dto.amountEGP,
        provider: PaymentProviderEnum.MANUAL,
        status: PaymentStatus.PAID,
        providerRef: dto.reference || null,
        paidAt: new Date(),
      },
    });

    await this.notificationService.notifyAdmin({
      type: NotificationType.PAYMENT_RECEIVED,
      title: `دفعة جديدة: ${payment.amountEGP} جنيه من ${student.name}`,
      body: `الكورس: ${course.title} — دفعة يدوية`,
      link: `/admin/payments`,
    });

    return { payment, enrollment };
  }
}
