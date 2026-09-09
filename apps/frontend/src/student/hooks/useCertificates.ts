import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { StudentCertificate } from "../types/api";

export function useMyCertificates() {
  return useQuery({
    queryKey: ["student", "certificates", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentCertificate[]>("/certificates/me");
      return data;
    },
  });
}

export function useCertificateDownloadUrl() {
  return useMutation({
    mutationFn: async (certificateId: string) => {
      const { data } = await apiClient.get<{ url: string }>(
        `/certificates/${certificateId}/download-url`,
      );
      return data.url;
    },
  });
}
