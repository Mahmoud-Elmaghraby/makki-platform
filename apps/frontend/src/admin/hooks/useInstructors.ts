import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { uploadToPresignedPost } from "../lib/uploadToPresignedPost";
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

// ============================================================
// رفع صورة المدرب الشخصية — نفس نمط رفع صورة غلاف الكورس بالظبط
// (useCourses.ts): بنطلب presigned POST policy، بنرفع الملف عليه مباشرة من
// المتصفح لـ B2 (من غير ما يعدي على السيرفر بتاعنا)، وبعدين بنأكد الرفع
// عشان يتخزن رابط الصورة الجاهز على المدرب.
// ============================================================

export function useInstructorPhotoUploadUrl(instructorId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{
        uploadUrl: string;
        uploadFields: Record<string, string>;
        storageKey: string;
      }>(`/instructors/${instructorId}/photo-upload-url`);
      return data;
    },
  });
}

export function uploadInstructorPhotoFile(
  uploadUrl: string,
  uploadFields: Record<string, string>,
  file: File,
) {
  return uploadToPresignedPost(uploadUrl, uploadFields, file);
}

export function useConfirmInstructorPhotoUpload(instructorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storageKey: string) => {
      const { data } = await apiClient.post<Instructor>(
        `/instructors/${instructorId}/confirm-photo-upload`,
        { storageKey },
      );
      return data;
    },
    // زي useUpdateInstructor: الصورة متضمّنة جوه رد المستخدمين والكورسات
    // كمان، فلازم نبطل الكاش بتاعهم عشان الصورة الجديدة تظهر من غير refresh
    // كامل للصفحة.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["users", "admin"] });
    },
  });
}
