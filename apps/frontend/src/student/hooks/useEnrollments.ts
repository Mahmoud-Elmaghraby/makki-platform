import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { MyEnrollment } from "../types/api";

export function useMyEnrollments() {
  return useQuery({
    queryKey: ["student", "enrollments", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyEnrollment[]>("/enrollments/me");
      return data;
    },
  });
}
