import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { useExam, useDeleteQuestion } from "../hooks/useExams";
import { Button, Card, Badge, LoadingState, ErrorBanner, EmptyState, PageHeader } from "../components/ui";
import { QuestionFormModal } from "../components/QuestionFormModal";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Question } from "../types/api";

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح / خطأ",
  ESSAY: "مقالي",
};

export function ExamEditorPage() {
  const { courseId, examId } = useParams<{ courseId: string; examId: string }>();
  const { data: exam, isLoading, error } = useExam(courseId, examId);
  const deleteQuestion = useDeleteQuestion(courseId ?? "", examId ?? "");
  const toast = useToast();
  const [modal, setModal] = useState<{ question?: Question } | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!exam || !courseId || !examId) return null;

  async function handleDelete(question: Question) {
    if (!confirm("متأكد إنك عايز تمسح السؤال ده؟")) return;
    try {
      await deleteQuestion.mutateAsync(question.id);
      toast.success("تم حذف السؤال");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const questions = (exam.questions ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <div>
      <Link
        to={`/admin/courses/${courseId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-navy)"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للكورس
      </Link>

      <PageHeader
        title={exam.title}
        description={`${questions.length} سؤال${exam.passingScore != null ? ` · درجة النجاح ${exam.passingScore}` : ""}`}
        actions={
          <>
            <Link to={`/admin/courses/${courseId}/exams/${examId}/attempts`}>
              <Button variant="secondary">
                <ClipboardCheck className="h-4 w-4" />
                محاولات الطلاب
              </Button>
            </Link>
            <Button onClick={() => setModal({})}>
              <Plus className="h-4 w-4" />
              سؤال جديد
            </Button>
          </>
        }
      />

      {questions.length === 0 && (
        <EmptyState title="لسه مفيش أسئلة" description="ضيف أول سؤال في الامتحان ده." />
      )}

      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((question, idx) => (
            <Card key={question.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs text-(--color-muted)">
                    <span>سؤال {idx + 1}</span>
                    <Badge>{TYPE_LABEL[question.type]}</Badge>
                    <span>{question.points} درجة</span>
                  </div>
                  <p className="text-sm font-medium text-(--color-navy)">{question.text}</p>
                  {question.type === "MULTIPLE_CHOICE" && (
                    <ul className="mt-2 space-y-1">
                      {question.options?.map((option) => (
                        <li
                          key={option.id}
                          className={`text-xs ${option.id === question.correctOptionId ? "font-semibold text-emerald-700" : "text-(--color-muted)"}`}
                        >
                          {option.id === question.correctOptionId ? "✓ " : "· "}
                          {option.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {question.type === "TRUE_FALSE" && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      الإجابة الصحيحة: {question.correctBoolean ? "صح" : "خطأ"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setModal({ question })}
                    className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question)}
                    className="rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <QuestionFormModal
          open
          onClose={() => setModal(null)}
          courseId={courseId}
          examId={examId}
          question={modal.question}
        />
      )}
    </div>
  );
}
