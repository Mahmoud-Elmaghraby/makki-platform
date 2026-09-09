import { ConflictException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { EnrollmentStatus, PaymentStatus } from '../generated/prisma/enums';

// اختبارات payments.service.ts — أهم جزء هنا هو idempotency الـ webhook
// (Kashier ممكن يبعت نفس الحدث أكتر من مرة) والتأكد إن التوقيع الغلط
// بيتجاهل من غير ما يلمس أي بيانات.

function buildService() {
  const prisma = {
    student: { findUnique: jest.fn() },
    course: { findUnique: jest.fn() },
    enrollment: { findUnique: jest.fn() },
    payment: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  const enrollmentService = { adminEnroll: jest.fn() };

  const kashier = {
    createCheckoutSession: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    parseWebhookEvent: jest.fn(),
  };

  const service = new PaymentsService(
    prisma as any,
    enrollmentService as any,
    kashier as any,
  );

  return { service, prisma, enrollmentService, kashier };
}

describe('PaymentsService', () => {
  describe('initiateCheckout', () => {
    it('يرفض لو الطالب مشترك فعلاً بالكورس (ACTIVE)', async () => {
      const { service, prisma } = buildService();
      prisma.student.findUnique.mockResolvedValue({ id: 's1', name: 'أحمد', email: null });
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true, priceEGP: 500 });
      prisma.enrollment.findUnique.mockResolvedValue({ status: EnrollmentStatus.ACTIVE });

      await expect(service.initiateCheckout('s1', 'c1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('بينشئ Payment بحالة PENDING ويرجّع رابط الدفع لو مفيش اشتراك نشط', async () => {
      const { service, prisma, kashier } = buildService();
      prisma.student.findUnique.mockResolvedValue({ id: 's1', name: 'أحمد', email: null });
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true, priceEGP: 500 });
      prisma.enrollment.findUnique.mockResolvedValue(null);
      prisma.payment.create.mockResolvedValue({ id: 'p1', amountEGP: 500 });
      kashier.createCheckoutSession.mockResolvedValue({ redirectUrl: 'https://checkout.kashier.io/?x=1' });

      const result = await service.initiateCheckout('s1', 'c1');

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: 's1',
            courseId: 'c1',
            amountEGP: 500,
            status: PaymentStatus.PENDING,
          }),
        }),
      );
      expect(result).toEqual({ paymentId: 'p1', redirectUrl: 'https://checkout.kashier.io/?x=1' });
    });
  });

  describe('handleKashierWebhook', () => {
    it('يتجاهل webhook بتوقيع غلط من غير ما يلمس أي بيانات', async () => {
      const { service, prisma, kashier } = buildService();
      kashier.verifyWebhookSignature.mockReturnValue(false);

      const result = await service.handleKashierWebhook({}, {});

      expect(result).toEqual({ ignored: true });
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('بيفعّل الاشتراك تلقائيًا لما الدفع ينجح', async () => {
      const { service, prisma, kashier, enrollmentService } = buildService();
      kashier.verifyWebhookSignature.mockReturnValue(true);
      kashier.parseWebhookEvent.mockReturnValue({
        providerRef: 'ref-1',
        merchantOrderId: 'p1',
        status: 'PAID',
      });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p1',
        studentId: 's1',
        courseId: 'c1',
        status: PaymentStatus.PENDING,
      });

      const result = await service.handleKashierWebhook({}, {});

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ status: PaymentStatus.PAID }),
        }),
      );
      expect(enrollmentService.adminEnroll).toHaveBeenCalledWith({
        studentId: 's1',
        courseId: 'c1',
      });
      expect(result).toEqual({ processed: true });
    });

    it('ميعملش حاجة تاني لو الدفعة دي اتعالجت قبل كده (idempotent)', async () => {
      const { service, prisma, kashier, enrollmentService } = buildService();
      kashier.verifyWebhookSignature.mockReturnValue(true);
      kashier.parseWebhookEvent.mockReturnValue({
        providerRef: 'ref-1',
        merchantOrderId: 'p1',
        status: 'PAID',
      });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p1',
        studentId: 's1',
        courseId: 'c1',
        status: PaymentStatus.PAID, // اتعالجت قبل كده بالفعل
      });

      const result = await service.handleKashierWebhook({}, {});

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(enrollmentService.adminEnroll).not.toHaveBeenCalled();
      expect(result).toEqual({ alreadyProcessed: true });
    });

    it('يسجّل الدفعة FAILED من غير ما يفعّل اشتراك لو البوابة رجّعت فشل', async () => {
      const { service, prisma, kashier, enrollmentService } = buildService();
      kashier.verifyWebhookSignature.mockReturnValue(true);
      kashier.parseWebhookEvent.mockReturnValue({
        providerRef: 'ref-1',
        merchantOrderId: 'p1',
        status: 'FAILED',
      });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p1',
        studentId: 's1',
        courseId: 'c1',
        status: PaymentStatus.PENDING,
      });

      await service.handleKashierWebhook({}, {});

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: PaymentStatus.FAILED }) }),
      );
      expect(enrollmentService.adminEnroll).not.toHaveBeenCalled();
    });
  });
});
