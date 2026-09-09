import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Exam, Question, QuestionOption, QuestionType } from "../types/api";

export interface ExamInput {
  title: string;
  description?: string;
  sectionId?: string;
  durationMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  isPublished?: boolean;
}

export interface QuestionInput {
  type: QuestionType;
  text: string;
  order?: number;
  points?: number;
  options?: QuestionOption[];
  correctOptionId?: string;
  correctBoolean?: boolean;
}

function invalidateCourseContent(
  queryClient: ReturnType<typeof useQueryClient>,
  courseId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["courses", "admin", "detail", courseId] });
  queryClient.invalidateQueries({ queryKey: ["exams", courseId] });
}

export function useExams(courseId: string | undefined) {
  return useQuery({
    queryKey: ["exams", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Exam[]>(`/courses/${courseId}/exams`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useExam(courseId: string | undefined, examId: string | undefined) {
  return useQuery({
    queryKey: ["exams", courseId, examId],
    queryFn: async () => {
      const { data } = await apiClient.get<Exam>(`/courses/${courseId}/exams/${examId}`);
      return data;
    },
    enabled: !!courseId && !!examId,
  });
}

export function useCreateExam(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExamInput) => {
      const { data } = await apiClient.post<Exam>(`/courses/${courseId}/exams`, input);
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useUpdateExam(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<ExamInput>) => {
      const { data } = await apiClient.patch<Exam>(`/courses/${courseId}/exams/${id}`, input);
      return data;
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useDeleteExam(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${courseId}/exams/${id}`);
    },
    onSuccess: () => invalidateCourseContent(queryClient, courseId),
  });
}

export function useAddQuestion(courseId: string, examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: QuestionInput) => {
      const { data } = await apiClient.post<Question>(
        `/courses/${courseId}/exams/${examId}/questions`,
        input,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams", courseId, examId] }),
  });
}

export function useUpdateQuestion(courseId: string, examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<QuestionInput>) => {
      const { data } = await apiClient.patch<Question>(
        `/courses/${courseId}/exams/${examId}/questions/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams", courseId, examId] }),
  });
}

export function useDeleteQuestion(courseId: string, examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${courseId}/exams/${examId}/questions/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams", courseId, examId] }),
  });
}
