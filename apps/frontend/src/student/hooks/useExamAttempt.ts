import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { ExamAttemptDetail, ExamAttemptSummary, ExamForTaking } from "../types/api";
import type { QuestionType } from "../types/api";

export function useExamForTaking(examId: string | undefined) {
  return useQuery({
    queryKey: ["student", "exam", examId, "take"],
    queryFn: async () => {
      const { data } = await apiClient.get<ExamForTaking>(`/exams/${examId}/take`);
      return data;
    },
    enabled: !!examId,
  });
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: async (examId: string) => {
      const { data } = await apiClient.post<ExamAttemptSummary>(`/exams/${examId}/attempts`);
      return data;
    },
  });
}

export function useAttemptDetail(attemptId: string | undefined) {
  return useQuery({
    queryKey: ["student", "exam-attempt", attemptId],
    queryFn: async () => {
      const { data } = await apiClient.get<ExamAttemptDetail>(`/exam-attempts/${attemptId}`);
      return data;
    },
    enabled: !!attemptId,
  });
}

interface SubmitAnswerPayload {
  attemptId: string;
  questionId: string;
  type: QuestionType;
  selectedOptionId?: string;
  booleanAnswer?: boolean;
  essayText?: string;
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, questionId, type: _type, ...body }: SubmitAnswerPayload) => {
      const { data } = await apiClient.patch(
        `/exam-attempts/${attemptId}/answers/${questionId}`,
        body,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["student", "exam-attempt", variables.attemptId],
      });
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const { data } = await apiClient.post<ExamAttemptSummary>(
        `/exam-attempts/${attemptId}/submit`,
      );
      return data;
    },
    onSuccess: (_data, attemptId) => {
      void queryClient.invalidateQueries({ queryKey: ["student", "exam-attempt", attemptId] });
      void queryClient.invalidateQueries({ queryKey: ["student", "certificates", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["student", "enrollments", "me"] });
    },
  });
}
