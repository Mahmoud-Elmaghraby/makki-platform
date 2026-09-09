import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useExamAttemptDetail, useGradeAnswer } from "../hooks/useGrading";
import { Card, Badge, LoadingState, ErrorBanner, PageHeader, Textarea, Input, Button, Field } from "../components/ui";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Answer } from "../types/api";

function EssayGradeForm({
  courseId,
  examId,
  attemptId,
  answer,
}: {
  courseId: string;
  examId: string;
  attemptId: string;
  answer: Answer;
}) {
  const toast = useToast();
  const gradeAnswer = useGradeAnswer(courseId, examId, attemptId);
  const [points, setPoints] = useState(answer.pointsAwarded?.toString() ?? "");
  const [feedback, setFeedback] = useState(answer.teacherFeedback ?? "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await gradeAnswer.mutateAsync({
        questionId: answer.questionId,
        pointsAwarded: Number(points) || 0,
        teacherFeedback: feedback || undefined,
      });
      toast.success("تم حفظ التصحيح");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg bg-(--color-paper-alt)/50 p-3">
      <div className="flex items-end gap-3">
        <Field label={`الدرجة (من ${answer.question?.points ?? 0})`}>
          <Input
            type="number"
            min={0}
            max={answer.question?.points}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm" loading={gradeAnswer.isPending}>
          حفظ الدرجة
        </Button>
      </div>
      <Field label="ملاحظة للطالب" hint="اختياري">
        <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </Field>
      {answer.pointsAwarded != null && (
        <p className="text-xs text-(--color-muted)">آخر درجة محفوظة: {answer.pointsAwarded}</p>
      )}
    </form>
  );
}

export function ExamAttemptGradingPage() {
  const { courseId, examId, attemptId } = useParams<{
    courseId: string;
    examId: string;
    attemptId: string;
  }>();
  const { data: attempt, isLoading, error } = useExamAttemptDetail(courseId, examId, attemptId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!attempt || !courseId || !examId || !attemptId) return null;

  const answers = attempt.answers.slice().sort((a, b) => (a.question?.order ?? 0) - (b.question?.order ?? 0));

  return (
    <div>
      <Link
        to={`/admin/courses/${courseId}/exams/${examId}/attempts`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-navy)"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع لقائمة المحاولات
      </Link>

      <PageHeader
        title={`إجابات ${attempt.student?.name ?? "الطالب"}`}
        description={
          attempt.score != null && attempt.maxScore != null
            ? `الدرجة الكلية: ${attempt.score} / ${attempt.maxScore}`
            : "الامتحان لسه محتاج تصحيح الأسئلة المقالية"
        }
        actions={
          <Badge tone={attempt.status === "GRADED" ? "success" : "warning"}>
            {attempt.status === "GRADED" ? "اتصحح بالكامل" : "محتاج تصحيح"}
          </Badge>
        }
      />

      <div className="space-y-3">
        {answers.map((answer, idx) => {
          const question = answer.question;
          if (!question) return null;
          const isEssay = question.type === "ESSAY";
          const isCorrect =
            !isEssay &&
            (question.type === "MULTIPLE_CHOICE"
              ? answer.selectedOptionId === question.correctOptionId
              : answer.booleanAnswer === question.correctBoolean);

          return (
            <Card key={answer.id} className="p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-(--color-muted)">
                <span>سؤال {idx + 1} · {question.points} درجة</span>
                {!isEssay && (
                  <span
                    className={
                      isCorrect ? "flex items-center gap-1 text-emerald-700" : "flex items-center gap-1 text-red-600"
                    }
                  >
                    {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {answer.pointsAwarded ?? 0} / {question.points}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-(--color-navy)">{question.text}</p>

              {question.type === "MULTIPLE_CHOICE" && (
                <p className="mt-2 text-sm text-(--color-muted)">
                  إجابة الطالب:{" "}
                  <span className={isCorrect ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
                    {question.options?.find((o) => o.id === answer.selectedOptionId)?.text ?? "لم يُجب"}
                  </span>
                </p>
              )}
              {question.type === "TRUE_FALSE" && (
                <p className="mt-2 text-sm text-(--color-muted)">
                  إجابة الطالب:{" "}
                  <span className={isCorrect ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
                    {answer.booleanAnswer == null ? "لم يُجب" : answer.booleanAnswer ? "صح" : "خطأ"}
                  </span>
                </p>
              )}
              {isEssay && (
                <>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-(--color-paper-alt)/50 p-3 text-sm text-(--color-navy)">
                    {answer.essayText || "لم يُجب"}
                  </p>
                  <EssayGradeForm
                    courseId={courseId}
                    examId={examId}
                    attemptId={attemptId}
                    answer={answer}
                  />
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
