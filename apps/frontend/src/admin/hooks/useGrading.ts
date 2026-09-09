import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Exam, ExamAttemptDetail, ExamAttemptSummary } from "../types/api";

// كل الامتحانات المنشورة في كل الكورسات — بنجيبها عشان نبني قائمة "امتحانات
// محتاجة تصحيح" من غير ما الأدمن يدخل كل كورس لوحده.
export function usePublishedExamsAcrossCourses(courseIds: string[]) {
  return useQuery({
    queryKey: ["exams", "grading-overview", courseIds],
    queryFn: async () => {
      const results = await Promise.all(
        courseIds.map((courseId) =>
          apiClient
            .get<Exam[]>(`/courses/${courseId}/exams`)
            .then((res) => res.data.map((exam) => ({ ...exam, courseId }))),
        ),
      );
      return results.flat();
    },
    enabled: courseIds.length > 0,
  });
}

export function useExamAttempts(courseId: string | undefined, examId: string | undefined) {
  return useQuery({
    queryKey: ["exam-attempts", courseId, examId],
    queryFn: async () => {
      const { data } = await apiClient.get<ExamAttemptSummary[]>(
        `/courses/${courseId}/exams/${examId}/attempts`,
      );
      return data;
    },
    enabled: !!courseId && !!examId,
  });
}

export function useExamAttemptDetail(
  courseId: string | undefined,
  examId: string | undefined,
  attemptId: string | undefined,
) {
  return useQuery({
    queryKey: ["exam-attempts", courseId, examId, attemptId],
    queryFn: async () => {
      const { data } = await apiClient.get<ExamAttemptDetail>(
        `/courses/${courseId}/exams/${examId}/attempts/${attemptId}`,
      );
      return data;
    },
    enabled: !!courseId && !!examId && !!attemptId,
  });
}

export function useGradeAnswer(
  courseId: string,
  examId: string,
  attemptId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      pointsAwarded,
      teacherFeedback,
    }: {
      questionId: string;
      pointsAwarded: number;
      teacherFeedback?: string;
    }) => {
      const { data } = await apiClient.patch(
        `/courses/${courseId}/exams/${examId}/attempts/${attemptId}/answers/${questionId}/grade`,
        { pointsAwarded, teacherFeedback },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exam-attempts", courseId, examId, attemptId],
      });
      queryClient.invalidateQueries({ queryKey: ["exam-attempts", courseId, examId] });
    },
  });
}
