import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import {
  CheckoutPaymentInput,
  CheckoutSessionResult,
  ParsedWebhookEvent,
  PaymentGateway,
} from '../payment-gateway.interface';

const KASHIER_CHECKOUT_BASE_URL = 'https://checkout.kashier.io';
const CURRENCY = 'EGP';

/**
 * تطبيق Kashier لـ PaymentGateway — أول (وحاليًا الوحيد) تطبيق فعلي.
 * اخترناها لأنها الوحيدة من بين البوابات اللي راجعناها (Paymob, Kashier,
 * Fawry, PayTabs, Geidea) اللي بتسمح صراحة بحساب Sandbox وتجربة فعلية من
 * غير ما تستنى اكتمال التوثيق التجاري (KYC) — راجع claude/sprint-payments.md.
 *
 * ⚠️ تنبيه مهم: خوارزمية بناء رابط الدفع (createCheckoutSession) هنا مبنية
 * على النمط الشائع الموثّق في مصادر مجتمعية لـ Kashier (مش من لوحة التحكم
 * الرسمية بتاعتهم، لأن صفحات التوثيق بتاعتهم بترفض أي طلب آلي). خوارزمية
 * التحقق من توقيع الـ webhook (verifyWebhookSignature) أكيدة أكتر (موثّقة في
 * أكتر من مصدر مستقل). **لازم يتم التأكد من شكل رابط الـ checkout بالظبط من
 * صفحة "Integration Guide" في لوحة تحكم Kashier فور ما يبقى عندنا حساب
 * Sandbox حقيقي** — لو الشكل مختلف، التعديل هيكون في الملف ده بس.
 */
@Injectable()
export class KashierProvider implements PaymentGateway {
  private readonly logger = new Logger(KashierProvider.name);

  private get merchantId(): string {
    return process.env.KASHIER_MERCHANT_ID as string;
  }

  /** الـ "Payment API Key" (مش الـ Secret Key) — ده اللي بيتستخدم في حساب الـ HMAC حسب توثيق Kashier. */
  private get apiKey(): string {
    return process.env.KASHIER_API_KEY as string;
  }

  private get mode(): 'test' | 'live' {
    return process.env.KASHIER_MODE === 'live' ? 'live' : 'test';
  }

  async createCheckoutSession(input: CheckoutPaymentInput): Promise<CheckoutSessionResult> {
    const amount = input.amountEGP.toFixed(2);
    const path = `/?payment=${this.merchantId}.${input.paymentId}.${amount}.${CURRENCY}`;
    const hash = createHmac('sha256', this.apiKey).update(path).digest('hex');

    const frontendOrigin = process.env.FRONTEND_ORIGIN as string;
    const apiPublicUrl = process.env.API_PUBLIC_URL as string;

    const params = new URLSearchParams({
      merchantId: this.merchantId,
      orderId: input.paymentId,
      amount,
      currency: CURRENCY,
      hash,
      mode: this.mode,
      merchantRedirect: `${frontendOrigin}/student/payments/${input.paymentId}`,
      serverWebhook: `${apiPublicUrl}/payments/webhook/kashier`,
      display: 'ar',
      customerReference: input.paymentId,
    });

    if (input.studentEmail) {
      params.set('email', input.studentEmail);
    }

    return { redirectUrl: `${KASHIER_CHECKOUT_BASE_URL}/?${params.toString()}` };
  }

  verifyWebhookSignature(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const signatureHeader = headers['x-kashier-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) return false;

    const data = payload.data as Record<string, unknown> | undefined;
    const signatureKeys = payload.signatureKeys as string[] | undefined;
    if (!data || !signatureKeys || signatureKeys.length === 0) {
      this.logger.warn('webhook من Kashier من غير data/signatureKeys — اتجاهل');
      return false;
    }

    // التوثيق بيقول نرتب حقول signatureKeys أبجديًا ونبني منها query string
    // بقيمها من جوه data، وبعدين HMAC-SHA256 بنفس الـ Payment API Key.
    const queryString = [...signatureKeys]
      .sort()
      .map((key) => `${key}=${String(data[key])}`)
      .join('&');

    const expected = createHmac('sha256', this.apiKey).update(queryString).digest('hex');
    return expected === signature;
  }

  parseWebhookEvent(payload: Record<string, unknown>): ParsedWebhookEvent {
    const data = (payload.data ?? {}) as Record<string, unknown>;
    const status = data.status === 'SUCCESS' ? 'PAID' : 'FAILED';

    return {
      providerRef: String(data.kashierOrderId ?? data.transactionId ?? ''),
      merchantOrderId: String(data.merchantOrderId ?? ''),
      status,
    };
  }
}
