import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Certificate } from "../types/api";

export function useCertificatesAdmin(courseId?: string) {
  return useQuery({
    queryKey: ["certificates", "admin", courseId ?? "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<Certificate[]>("/admin/certificates", {
        params: courseId ? { courseId } : undefined,
      });
      return data;
    },
  });
}
