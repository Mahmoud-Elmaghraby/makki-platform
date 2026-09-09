import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Enrollment, Student } from "../types/api";

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data } = await apiClient.get<Student[]>("/students/all");
      return data;
    },
  });
}

export function useSetStudentActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await apiClient.patch<Student>(`/students/${id}/status`, { isActive });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useEnrollments(filters?: { courseId?: string; studentId?: string }) {
  return useQuery({
    queryKey: ["enrollments", filters?.courseId ?? "all", filters?.studentId ?? "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<Enrollment[]>("/enrollments", {
        params: {
          courseId: filters?.courseId,
          studentId: filters?.studentId,
        },
      });
      return data;
    },
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { studentId: string; courseId: string }) => {
      const { data } = await apiClient.post<Enrollment>("/enrollments", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
  });
}

export function useRevokeEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/enrollments/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
  });
}
