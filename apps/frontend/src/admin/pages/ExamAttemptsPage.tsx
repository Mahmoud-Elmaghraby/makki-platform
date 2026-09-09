import { useParams, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useExamAttempts } from "../hooks/useGrading";
import { useExam } from "../hooks/useExams";
import { Card, Badge, LoadingState, ErrorBanner, EmptyState, PageHeader } from "../components/ui";
import { extractErrorMessage } from "../lib/apiClient";

const STATUS_LABEL: Record<string, { label: string; tone: "neutral" | "warning" | "success" }> = {
  IN_PROGRESS: { label: "بيؤدي الامتحان", tone: "neutral" },
  SUBMITTED: { label: "محتاج تصحيح", tone: "warning" },
  GRADED: { label: "اتصحح", tone: "success" },
};

export function ExamAttemptsPage() {
  const { courseId, examId } = useParams<{ courseId: string; examId: string }>();
  const { data: exam } = useExam(courseId, examId);
  const { data: attempts, isLoading, error } = useExamAttempts(courseId, examId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorBanner message={extractErrorMessage(error)} />;

  return (
    <div>
      <Link
        to={`/admin/courses/${courseId}/exams/${examId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-navy)"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع لأسئلة الامتحان
      </Link>

      <PageHeader title={`محاولات: ${exam?.title ?? ""}`} description="راجع وصحّح إجابات الطلاب" />

      {attempts && attempts.length === 0 && <EmptyState title="لسه محدش أدّى الامتحان ده" />}

      {attempts && attempts.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {attempts.map((attempt) => {
            const status = STATUS_LABEL[attempt.status];
            return (
              <Link
                key={attempt.id}
                to={`/admin/courses/${courseId}/exams/${examId}/attempts/${attempt.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-(--color-paper-alt)/40"
              >
                <div>
                  <div className="text-sm font-medium text-(--color-navy)">
                    {attempt.student?.name ?? "طالب"}
                  </div>
                  <div className="text-xs text-(--color-muted)" dir="ltr">
                    {attempt.student?.phone}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {attempt.score != null && attempt.maxScore != null && (
                    <span className="text-(--color-muted)">
                      {attempt.score} / {attempt.maxScore}
                    </span>
                  )}
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
