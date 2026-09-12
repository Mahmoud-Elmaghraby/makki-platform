import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { uploadToPresignedPost } from "../lib/uploadToPresignedPost";
import type { Course, CourseDetail, CourseTrack, Faculty, AcademicYear } from "../types/api";

export interface CourseInput {
  title: string;
  slug: string;
  description?: string;
  detailedDescription?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  targetAudience?: string;
  track: CourseTrack;
  faculty?: Faculty;
  academicYear?: AcademicYear;
  priceEGP: number;
  instructorId?: string;
  isPublished?: boolean;
}

export function useCourses(track: CourseTrack) {
  return useQuery({
    queryKey: ["courses", "admin", track],
    queryFn: async () => {
      const { data } = await apiClient.get<Course[]>("/courses/all");
      return data.filter((c) => c.track === track);
    },
  });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", "admin", "detail", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<CourseDetail>(`/courses/admin/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CourseInput) => {
      const { data } = await apiClient.post<Course>("/courses", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", "admin"] });
    },
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CourseInput>) => {
      const { data } = await apiClient.patch<Course>(`/courses/${courseId}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", "admin"] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      await apiClient.delete(`/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", "admin"] });
    },
  });
}

// ============================================================
// رفع صورة غلاف الكورس — نفس نمط رفع فيديو الدرس بالظبط (useLessons.ts):
// نطلب presigned POST policy، نرفع الملف عليه مباشرة من المتصفح لـ B2 (من
// غير ما يعدي على السيرفر بتاعنا)، وبعدين نأكد الرفع عشان نخزّن مفتاح
// التخزين على الكورس. من غير خطوة تحويل (processing) لأنها صورة مش فيديو.
// ============================================================

export function useCourseCoverUploadUrl(courseId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{
        uploadUrl: string;
        uploadFields: Record<string, string>;
        storageKey: string;
      }>(`/courses/${courseId}/cover-upload-url`);
      return data;
    },
  });
}

export function uploadCoverImageFile(
  uploadUrl: string,
  uploadFields: Record<string, string>,
  file: File,
) {
  return uploadToPresignedPost(uploadUrl, uploadFields, file);
}

export function useConfirmCoverUpload(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storageKey: string) => {
      const { data } = await apiClient.post<Course>(
        `/courses/${courseId}/confirm-cover-upload`,
        { storageKey },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", "admin"] });
    },
  });
}
