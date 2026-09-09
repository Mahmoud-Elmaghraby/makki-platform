import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
import { Button, Card, Badge, EmptyState } from "./ui";
import { ExamFormModal } from "./ExamFormModal";
import { useExams, useDeleteExam } from "../hooks/useExams";
import { useSections } from "../hooks/useSections";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Exam } from "../types/api";

export function CourseExamsTab({ courseId }: { courseId: string }) {
  const examsQuery = useExams(courseId);
  const sectionsQuery = useSections(courseId);
  const deleteExam = useDeleteExam(courseId);
  const toast = useToast();

  const [modal, setModal] = useState<{ exam?: Exam } | null>(null);

  async function handleDelete(exam: Exam) {
    if (!confirm(`متأكد إنك عايز تمسح امتحان "${exam.title}"؟`)) return;
    try {
      await deleteExam.mutateAsync(exam.id);
      toast.success("تم حذف الامتحان");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const sectionTitleById = new Map((sectionsQuery.data ?? []).map((s) => [s.id, s.title]));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModal({})}>
          <Plus className="h-4 w-4" />
          امتحان جديد
        </Button>
      </div>

      {examsQuery.data && examsQuery.data.length === 0 && (
        <EmptyState
          title="لسه مفيش امتحانات"
          description="ضيف امتحان نص الكورس أو امتحان نهائي، وبعدين ضيف أسئلته."
        />
      )}

      {examsQuery.data && examsQuery.data.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {examsQuery.data.map((exam) => (
            <div key={exam.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  to={`/admin/courses/${courseId}/exams/${exam.id}`}
                  className="flex items-center gap-2 font-medium text-(--color-navy) hover:text-(--color-royal-light) hover:underline"
                >
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  {exam.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--color-muted)">
                  {exam.sectionId && <span>{sectionTitleById.get(exam.sectionId) ?? "قسم"}</span>}
                  <span>{exam._count?.questions ?? 0} سؤال</span>
                  <span>{exam._count?.attempts ?? 0} محاولة</span>
                  {exam.passingScore != null && <span>درجة النجاح: {exam.passingScore}</span>}
                  <Badge tone={exam.isPublished ? "success" : "neutral"}>
                    {exam.isPublished ? "منشور" : "مسودة"}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setModal({ exam })}
                  className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(exam)}
                  className="rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {modal && (
        <ExamFormModal
          open
          onClose={() => setModal(null)}
          courseId={courseId}
          exam={modal.exam}
          sections={sectionsQuery.data ?? []}
        />
      )}
    </div>
  );
}
