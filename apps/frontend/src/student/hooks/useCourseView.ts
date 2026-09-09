import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { PlaybackToken, StudentCourseView } from "../types/api";

export function useCourseView(slug: string | undefined) {
  return useQuery({
    queryKey: ["student", "course", slug],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentCourseView>(`/courses/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}

export function usePlaybackToken() {
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data } = await apiClient.get<PlaybackToken>(`/lessons/${lessonId}/playback-token`);
      return data;
    },
  });
}

export function useUpdateLessonProgress(courseSlug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, positionSeconds }: { lessonId: string; positionSeconds: number }) => {
      const { data } = await apiClient.post(`/lessons/${lessonId}/progress`, { positionSeconds });
      return data;
    },
    onSuccess: () => {
      // بنعيد جلب صفحة الكورس عشان علامة "مكتمل" ونسبة التقدم تتحدث، وكمان
      // قائمة "كورساتي" (النسبة هناك كمان محتاجة تتحدث).
      if (courseSlug) {
        void queryClient.invalidateQueries({ queryKey: ["student", "course", courseSlug] });
      }
      void queryClient.invalidateQueries({ queryKey: ["student", "enrollments", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "certificates", "me"] });
    },
  });
}

export function useAttachmentDownloadUrl() {
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const { data } = await apiClient.get<{ url: string }>(
        `/attachments/${attachmentId}/download-url`,
      );
      return data.url;
    },
  });
}
