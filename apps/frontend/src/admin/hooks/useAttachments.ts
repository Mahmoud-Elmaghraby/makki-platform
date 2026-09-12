import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { uploadFileToApi } from "../lib/uploadFileToApi";
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
      const { data } = await apiClient.post<{ attachment: Attachment }>(
        `/courses/${courseId}/attachments`,
        input,
      );
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

/**
 * رفع ملف المرفق — بيعدي على الـ API بتاعنا (نفس الدومين، مفيش CORS) وهو
 * اللي يرفعه لـ B2 من جواه.
 */
export function useUploadAttachmentFile(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      attachmentId,
      file,
      onProgress,
    }: {
      attachmentId: string;
      file: File;
      onProgress?: (percent: number) => void;
    }) => {
      return uploadFileToApi<Attachment>(
        `/courses/${courseId}/attachments/${attachmentId}/upload`,
        file,
        onProgress,
      );
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
