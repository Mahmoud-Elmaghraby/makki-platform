import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { uploadFileToApi } from "../lib/uploadFileToApi";
import type { Lesson } from "../types/api";

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
      const { data } = await apiClient.post<{ lesson: Lesson }>(
        `/courses/${courseId}/lessons`,
        input,
      );
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

/**
 * رفع فيديو الدرس — بيعدي على الـ API بتاعنا (نفس الدومين، مفيش CORS) وهو
 * اللي يرفعه لـ B2 من جواه ويجدول التحويل (transcode) تلقائيًا. خطوة واحدة
 * بس، من غير presigned URL ولا تأكيد منفصل.
 */
export function useUploadLessonVideo(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId,
      file,
      onProgress,
    }: {
      lessonId: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => {
      return uploadFileToApi<{ queued: boolean }>(
        `/courses/${courseId}/lessons/${lessonId}/upload`,
        file,
        onProgress,
      );
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
