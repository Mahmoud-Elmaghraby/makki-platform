import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { CheckoutSession, PaymentStatus } from "../types/api";

/** بيبدأ جلسة دفع لكورس معيّن ويرجّع رابط بوابة الدفع (الطالب بيتحول عليه مباشرة). */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await apiClient.post<CheckoutSession>("/payments/checkout", { courseId });
      return data;
    },
  });
}

/** لصفحة الرجوع بعد الدفع — بس للعرض، تفعيل الاشتراك الفعلي بيحصل من الـ webhook مش من هنا. */
export function usePaymentStatus(paymentId: string | undefined) {
  return useQuery({
    queryKey: ["student", "payment", paymentId],
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentStatus>(`/payments/${paymentId}`);
      return data;
    },
    enabled: !!paymentId,
    // الحالة ممكن توصل PENDING الأول والـ webhook لسه ما وصلش، فبنعيد السؤال
    // كل ٣ ثواني لحد ما تستقر (PAID/FAILED) — مش أوضح من كده من غير WebSocket.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" ? 3000 : false;
    },
  });
}
