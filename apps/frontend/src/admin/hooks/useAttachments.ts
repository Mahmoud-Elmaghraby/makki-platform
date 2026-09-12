import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Attachment } from "../types/api";

export interface AttachmentInput {
  title: string;
  fileName: string;
  fileSizeBytes?: number;
  sectionId?: string;
  lessonId?: string;
}

function invalidateCourseContent(
  queryClient: ReturnType<typeof useQueryClient>,
  courseId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["courses", "admin", "detail", courseId] });
  queryClient.invalidateQueries({ queryKey: ["attachments", courseId] });
}

export function useAttachments(courseId: string | undefined) {
  return useQuery({
    queryKey: ["attachments", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Attachment[]>(`/courses/${courseId}/attachments`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCreateAttachment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttachmentInput) => {
      const { data } = await apiClient.post<{
        attachment: Attachment;
        uploadUrl: string;
        uploadFields: Record<string, string>;
      }>(`/courses/${courseId}/attachments`, input);
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useDeleteAttachment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${courseId}/attachments/${id}`);
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}
