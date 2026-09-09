import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Card, PageHeader, LoadingState, ErrorBanner, EmptyState } from "../components/ui";
import { InstructorFormModal } from "../components/InstructorFormModal";
import { useInstructors, useDeleteInstructor } from "../hooks/useInstructors";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Instructor } from "../types/api";

export function InstructorsPage() {
  const { data: instructors, isLoading, error } = useInstructors();
  const deleteInstructor = useDeleteInstructor();
  const toast = useToast();
  const [modal, setModal] = useState<{ instructor?: Instructor } | null>(null);

  async function handleDelete(instructor: Instructor) {
    if (!confirm(`متأكد إنك عايز تمسح حساب "${instructor.name}"؟`)) return;
    try {
      await deleteInstructor.mutateAsync(instructor.id);
      toast.success("تم حذف الحساب");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="المدربين"
        description="حسابات المدربين اللي بيقدروا يديروا كورساتهم ودوراتهم"
        actions={
          <Button onClick={() => setModal({})}>
            <Plus className="h-4 w-4" />
            مدرب جديد
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorBanner message={extractErrorMessage(error)} />}

      {instructors && instructors.length === 0 && (
        <EmptyState title="لسه مفيش مدربين مضافين" />
      )}

      {instructors && instructors.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {instructors.map((instructor) => (
            <div key={instructor.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="text-sm font-medium text-(--color-navy)">{instructor.name}</div>
                <div className="text-xs text-(--color-muted)" dir="ltr">
                  {instructor.user?.email}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setModal({ instructor })}
                  className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(instructor)}
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
        <InstructorFormModal open onClose={() => setModal(null)} instructor={modal.instructor} />
      )}
    </div>
  );
}
