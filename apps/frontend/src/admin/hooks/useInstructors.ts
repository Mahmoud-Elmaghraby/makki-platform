import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Instructor } from "../types/api";

export interface InstructorInput {
  name: string;
  email: string;
  password: string;
  bio?: string;
  photoUrl?: string;
}

export function useInstructors() {
  return useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data } = await apiClient.get<Instructor[]>("/instructors");
      return data;
    },
  });
}

export function useCreateInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InstructorInput) => {
      const { data } = await apiClient.post<Instructor>("/instructors", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructors"] }),
  });
}

export function useUpdateInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<Omit<InstructorInput, "email" | "password">>) => {
      const { data } = await apiClient.patch<Instructor>(`/instructors/${id}`, input);
      return data;
    },
    // اسم/صورة المدرب متضمّنة (embedded) جوه رد الكورسات نفسه (مش مجرد id) —
    // من غير إبطال كاش الكورسات كمان، قوائم/صفحات الكورسات هتفضل شايلة
    // الاسم القديم لحد ما يحصل refresh كامل للصفحة.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteInstructor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/instructors/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instructors"] }),
  });
}
