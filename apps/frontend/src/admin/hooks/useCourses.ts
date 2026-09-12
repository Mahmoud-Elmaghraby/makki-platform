import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { uploadFileToApi } from "../lib/uploadFileToApi";
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
// رفع صورة غلاف الكورس — بيعدي على الـ API بتاعنا (نفس الدومين، مفيش CORS)
// وهو اللي يرفعها لـ B2 من جواه. خطوة واحدة بس، من غير presigned URL ولا
// تأكيد منفصل.
// ============================================================

export function useUploadCourseCover(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (percent: number) => void;
    }) => {
      return uploadFileToApi<Course>(`/courses/${courseId}/cover`, file, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", "admin"] });
    },
  });
}
