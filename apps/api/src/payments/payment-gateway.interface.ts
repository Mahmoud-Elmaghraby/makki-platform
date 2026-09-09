// طبقة التجريد (abstraction) لبوابة الدفع — راجع technical-architecture.md قسم 6.
//
// اسمها هنا "PaymentGateway" مش "PaymentProvider" عمدًا، عشان الاسم التاني
// محجوز فعلاً لـ enum الـ Prisma (PAYMOB | KASHIER) وميتلخبطش مع الـ interface.
//
// أي بوابة دفع جديدة (Paymob مثلاً) بتعمل implement للـ interface ده بس،
// وموديول الدفع الأساسي (payments.service.ts) بيشتغل معاها من غير ما يعرف
// تفاصيلها — التبديل أو إضافة بوابة تانية بجانب دي ميأثرش على باقي الكود.

export interface CheckoutPaymentInput {
  /** ID صف الـ Payment عندنا — بيتبعت للبوابة كـ "merchant order id" عشان نربط الـ webhook بيه تاني. */
  paymentId: string;
  amountEGP: number;
  studentName: string;
  studentEmail: string | null;
}

export interface CheckoutSessionResult {
  /** الرابط اللي المتصفح هيتحول عليه عشان الطالب يدفع. */
  redirectUrl: string;
}

export type WebhookPaymentStatus = 'PAID' | 'FAILED';

export interface ParsedWebhookEvent {
  /** رقم/مرجع العملية عند البوابة نفسها (مش عندنا) — بيتخزن للمراجعة والدعم الفني. */
  providerRef: string;
  /** ده الـ paymentId بتاعنا اللي اتبعت وقت إنشاء جلسة الدفع. */
  merchantOrderId: string;
  status: WebhookPaymentStatus;
}

export interface PaymentGateway {
  createCheckoutSession(input: CheckoutPaymentInput): Promise<CheckoutSessionResult>;

  /** بيتنادى قبل أي حاجة تاني على أي webhook وارد — لو رجّع false نتجاهل الطلب كله. */
  verifyWebhookSignature(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ): boolean;

  /** بيتنادى بعد التأكد من التوقيع بس. */
  parseWebhookEvent(payload: Record<string, unknown>): ParsedWebhookEvent;
}
