import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { ConsultationRequest, ConsultationStatus, ConsultationType } from "../types/api";

export function useConsultations(filters?: { status?: ConsultationStatus; type?: ConsultationType }) {
  return useQuery({
    queryKey: ["consultations", "admin", filters?.status ?? "all", filters?.type ?? "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<ConsultationRequest[]>("/admin/consultations", {
        params: { status: filters?.status, type: filters?.type },
      });
      return data;
    },
  });
}

export function useUpdateConsultationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ConsultationStatus }) => {
      const { data } = await apiClient.patch(`/admin/consultations/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}
