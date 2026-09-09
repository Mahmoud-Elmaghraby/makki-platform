import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Plus, Pencil, Trash2 } from "lucide-react";
import { useCheckpoints, useDeleteCheckpoint } from "../hooks/useCheckpoints";
import { Button, Card, Badge, LoadingState, ErrorBanner, EmptyState, PageHeader } from "../components/ui";
import { CheckpointFormModal } from "../components/CheckpointFormModal";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Checkpoint } from "../types/api";

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح / خطأ",
};

function formatTimestamp(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function CheckpointEditorPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { data: checkpoints, isLoading, error } = useCheckpoints(courseId, lessonId);
  const deleteCheckpoint = useDeleteCheckpoint(courseId ?? "", lessonId ?? "");
  const toast = useToast();
  const [modal, setModal] = useState<{ checkpoint?: Checkpoint } | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!courseId || !lessonId) return null;

  async function handleDelete(checkpoint: Checkpoint) {
    if (!confirm("متأكد إنك عايز تمسح السؤال ده؟")) return;
    try {
      await deleteCheckpoint.mutateAsync(checkpoint.id);
      toast.success("تم حذف السؤال");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const sorted = (checkpoints ?? []).slice().sort((a, b) => a.timestampSeconds - b.timestampSeconds);

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
        title="أسئلة داخل الفيديو"
        description={`${sorted.length} سؤال — بتوقف الفيديو تلقائي عشان تتأكد إن الطالب مركّز، والفيديو يكمل عادي أيًّا كانت الإجابة`}
        actions={
          <Button onClick={() => setModal({})}>
            <Plus className="h-4 w-4" />
            سؤال جديد
          </Button>
        }
      />

      {sorted.length === 0 && (
        <EmptyState
          title="لسه مفيش أسئلة على الدرس ده"
          description="ضيف سؤال في أي لحظة من الفيديو، الطالب هيحتاج يجاوب عليه (صح أو غلط) عشان الفيديو يكمل."
        />
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((checkpoint) => (
            <Card key={checkpoint.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs text-(--color-muted)">
                    <Badge tone="gold">{formatTimestamp(checkpoint.timestampSeconds)}</Badge>
                    <Badge>{TYPE_LABEL[checkpoint.type]}</Badge>
                  </div>
                  <p className="text-sm font-medium text-(--color-navy)">{checkpoint.question}</p>
                  {checkpoint.type === "MULTIPLE_CHOICE" && (
                    <ul className="mt-2 space-y-1">
                      {checkpoint.options?.map((option) => (
                        <li
                          key={option.id}
                          className={`text-xs ${option.id === checkpoint.correctOptionId ? "font-semibold text-emerald-700" : "text-(--color-muted)"}`}
                        >
                          {option.id === checkpoint.correctOptionId ? "✓ " : "· "}
                          {option.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {checkpoint.type === "TRUE_FALSE" && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      الإجابة الصحيحة: {checkpoint.correctBoolean ? "صح" : "خطأ"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setModal({ checkpoint })}
                    className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(checkpoint)}
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
        <CheckpointFormModal
          open
          onClose={() => setModal(null)}
          courseId={courseId}
          lessonId={lessonId}
          checkpoint={modal.checkpoint}
        />
      )}
    </div>
  );
}
