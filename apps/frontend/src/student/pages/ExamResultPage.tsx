import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useAttemptDetail } from "../hooks/useExamAttempt";
import { Badge, Card, ErrorBanner, LoadingState, PageHeader } from "../../admin/components/ui";
import { extractErrorMessage } from "../lib/apiClient";

export function ExamResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data: attempt, isLoading, isError, error } = useAttemptDetail(attemptId);

  if (isLoading) return <LoadingState label="بيتم تحميل النتيجة..." />;
  if (isError) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!attempt) return null;

  const sortedAnswers = [...attempt.answers].sort((a, b) => a.question.order - b.question.order);

  return (
    <div>
      <PageHeader
        title={attempt.exam.title}
        description={
          attempt.status === "GRADED"
            ? `النتيجة: ${attempt.score ?? 0} من ${attempt.maxScore ?? 0}`
            : attempt.status === "SUBMITTED"
              ? "بانتظار تصحيح الأسئلة المقالية من المدرب"
              : "المحاولة لسه ما اتسلّمتش"
        }
        actions={
          attempt.status === "GRADED" ? (
            <Badge
              tone={
                attempt.exam.passingScore == null ||
                (attempt.score ?? 0) >= attempt.exam.passingScore
                  ? "success"
                  : "danger"
              }
            >
              {attempt.exam.passingScore == null ||
              (attempt.score ?? 0) >= attempt.exam.passingScore
                ? "ناجح"
                : "لم يجتز الحد الأدنى"}
            </Badge>
          ) : (
            <Badge tone="warning">
              <Clock3 className="ml-1 inline h-3.5 w-3.5" />
              قيد التصحيح
            </Badge>
          )
        }
      />

      <div className="space-y-3">
        {sortedAnswers.map((answer, index) => (
          <Card key={answer.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="font-medium text-(--color-navy)">
                {index + 1}. {answer.question.text}
              </p>
              <span className="shrink-0 text-xs text-(--color-muted)">
                {answer.pointsAwarded ?? "—"} / {answer.question.points}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-(--color-muted)">
              {answer.pointsAwarded != null && answer.pointsAwarded >= answer.question.points ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span>
                {answer.question.type === "TRUE_FALSE"
                  ? answer.booleanAnswer == null
                    ? "من غير إجابة"
                    : answer.booleanAnswer
                      ? "إجابتك: صح"
                      : "إجابتك: غلط"
                  : answer.question.type === "MULTIPLE_CHOICE"
                    ? (answer.question.options?.find((o) => o.id === answer.selectedOptionId)
                        ?.text ?? "من غير إجابة")
                    : (answer.essayText || "من غير إجابة")}
              </span>
            </div>

            {answer.teacherFeedback && (
              <p className="mt-2 rounded-lg bg-(--color-paper-alt) px-3 py-2 text-sm text-(--color-muted)">
                ملاحظة المدرب: {answer.teacherFeedback}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
