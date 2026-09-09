import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Payment, PaymentsStats, PaymentStatus } from "../types/api";

export function usePaymentsAdmin(filters?: { status?: PaymentStatus; courseId?: string }) {
  return useQuery({
    queryKey: ["payments", "admin", filters?.status ?? "all", filters?.courseId ?? "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<Payment[]>("/admin/payments", {
        params: {
          status: filters?.status,
          courseId: filters?.courseId,
        },
      });
      return data;
    },
  });
}

export function usePaymentsStatsAdmin() {
  return useQuery({
    queryKey: ["payments", "admin", "stats"],
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentsStats>("/admin/payments/stats");
      return data;
    },
  });
}

export interface RecordManualPaymentInput {
  studentId: string;
  courseId: string;
  amountEGP: number;
  reference?: string;
}

// تسجيل دفعة استلمت خارج المنصة (فودافون كاش/تحويل بنكي) بعد التأكد منها —
// بتفعّل الاشتراك وتسجّل الدفعة مع بعض، فبعد النجاح لازم نحدّث كل القوائم
// المتأثرة: المدفوعات، إحصائياتها، والاشتراكات.
export function useRecordManualPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecordManualPaymentInput) => {
      const { data } = await apiClient.post("/admin/payments/manual", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
