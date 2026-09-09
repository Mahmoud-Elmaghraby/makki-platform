import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
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
      const { data } = await apiClient.post<{ lesson: Lesson; uploadUrl: string }>(
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
      const { data } = await apiClient.post<{ uploadUrl: string }>(
        `/courses/${courseId}/lessons/${lessonId}/upload-url`,
      );
      return data.uploadUrl;
    },
  });
}

/**
 * بيرفع الفيديو مباشرة على B2 عن طريق presigned URL — مش عن طريق الـ API
 * (عشان الفيديو الكبير ميعديش على السيرفر بتاعنا). ملحوظة تجهيز: لازم الـ
 * bucket على B2 يكون فيه CORS rule بيسمح بـ PUT من دومين الفرونت إند، وإلا
 * الطلب هيتعمله رفض من المتصفح قبل ما يوصل لـ B2 أصلًا.
 */
export function uploadVideoFile(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  return fetch(uploadUrl, { method: "PUT", body: file }).then(async (res) => {
    onProgress?.(100);
    if (!res.ok) throw new Error("فشل رفع الفيديو، حاول تاني");
    return res;
  });
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
