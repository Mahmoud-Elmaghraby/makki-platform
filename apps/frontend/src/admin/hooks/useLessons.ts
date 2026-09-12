import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { uploadToPresignedPost } from "../lib/uploadToPresignedPost";
import type { Lesson } from "../types/api";

interface UploadUrlResponse {
  uploadUrl: string;
  uploadFields: Record<string, string>;
}

export interface LessonInput {
  title: string;
  description?: string;
  order?: number;
  isFreePreview?: boolean;
  isPublished?: boolean;
  sectionId?: string;
}

function invalidateCourseContent(
  queryClient: ReturnType<typeof useQueryClient>,
  courseId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["courses", "admin", "detail", courseId] });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LessonInput) => {
      const { data } = await apiClient.post<{ lesson: Lesson } & UploadUrlResponse>(
        `/courses/${courseId}/lessons`,
        input,
      );
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useLessonUploadUrl(courseId: string) {
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data } = await apiClient.post<UploadUrlResponse>(
        `/courses/${courseId}/lessons/${lessonId}/upload-url`,
      );
      return data;
    },
  });
}

/**
 * بيرفع الفيديو مباشرة على B2 عن طريق presigned **POST** policy — مش عن
 * طريق الـ API (عشان الفيديو الكبير ميعديش على السيرفر بتاعنا)، ومش presigned
 * PUT (عشان طلب PUT بيفرض CORS preflight دايمًا، وB2 بيرفضه — راجع
 * uploadToPresignedPost.ts للتفاصيل).
 */
export function uploadVideoFile(
  uploadUrl: string,
  uploadFields: Record<string, string>,
  file: File,
  onProgress?: (percent: number) => void,
) {
  return uploadToPresignedPost(uploadUrl, uploadFields, file, onProgress);
}

export function useConfirmUpload(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data } = await apiClient.post(
        `/courses/${courseId}/lessons/${lessonId}/confirm-upload`,
      );
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useLessonStatus(courseId: string, lessonId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["lessons", "status", courseId, lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        ready: boolean;
        failed: boolean;
        durationSeconds?: number;
      }>(`/courses/${courseId}/lessons/${lessonId}/status`);
      return data;
    },
    enabled: enabled && !!lessonId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || (!data.ready && !data.failed)) return 4000;
      return false;
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<LessonInput>) => {
      const { data } = await apiClient.patch<Lesson>(
        `/courses/${courseId}/lessons/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${courseId}/lessons/${id}`);
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}
