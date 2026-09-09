import { useState, type FormEvent } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { Button, Card, Badge, EmptyState, Select, ErrorBanner } from "./ui";
import { useEnrollments, useCreateEnrollment, useRevokeEnrollment, useStudents } from "../hooks/useStudents";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

export function CourseEnrollmentsTab({ courseId }: { courseId: string }) {
  const enrollmentsQuery = useEnrollments({ courseId });
  const studentsQuery = useStudents();
  const createEnrollment = useCreateEnrollment();
  const revokeEnrollment = useRevokeEnrollment();
  const toast = useToast();

  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enrolledStudentIds = new Set((enrollmentsQuery.data ?? []).map((e) => e.studentId));
  const availableStudents = (studentsQuery.data ?? []).filter(
    (s) => !enrolledStudentIds.has(s.id),
  );

  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!studentId) return;
    try {
      await createEnrollment.mutateAsync({ studentId, courseId });
      toast.success("تم تفعيل الاشتراك");
      setStudentId("");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleRevoke(id: string, name?: string) {
    if (!confirm(`متأكد إنك عايز تلغي اشتراك "${name ?? "الطالب"}"؟`)) return;
    try {
      await revokeEnrollment.mutateAsync(id);
      toast.success("تم إلغاء الاشتراك");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={handleEnroll} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1.5 block text-sm font-medium text-(--color-navy)">
              تفعيل اشتراك يدوي
            </label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">اختر طالب...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.phone}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={createEnrollment.isPending} disabled={!studentId}>
            <UserPlus className="h-4 w-4" />
            تفعيل
          </Button>
        </form>
        <p className="mt-2 text-xs text-(--color-muted)">
          استخدام مؤقت لحد ما بوابة الدفع تشتغل (Phase 2) — أو لحالات الدفع الأوفلاين.
        </p>
        {error && (
          <div className="mt-2">
            <ErrorBanner message={error} />
          </div>
        )}
      </Card>

      {enrollmentsQuery.data && enrollmentsQuery.data.length === 0 && (
        <EmptyState title="لسه مفيش طلاب مشتركين في الكورس ده" />
      )}

      {enrollmentsQuery.data && enrollmentsQuery.data.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {enrollmentsQuery.data.map((enrollment) => (
            <div key={enrollment.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="text-sm font-medium text-(--color-navy)">
                  {enrollment.student?.name}
                </div>
                <div className="text-xs text-(--color-muted)" dir="ltr">
                  {enrollment.student?.phone}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={enrollment.status === "ACTIVE" ? "success" : "danger"}>
                  {enrollment.status === "ACTIVE" ? "نشط" : "ملغي"}
                </Badge>
                {enrollment.status === "ACTIVE" && (
                  <button
                    onClick={() => handleRevoke(enrollment.id, enrollment.student?.name)}
                    className="rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
