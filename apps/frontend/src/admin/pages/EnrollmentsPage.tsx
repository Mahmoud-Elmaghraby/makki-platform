import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, Trash2, Search } from "lucide-react";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  LoadingState,
  ErrorBanner,
  EmptyState,
  Select,
  Input,
} from "../components/ui";
import {
  useEnrollments,
  useCreateEnrollment,
  useRevokeEnrollment,
  useStudents,
} from "../hooks/useStudents";
import { useCourses } from "../hooks/useCourses";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

/**
 * مكان مركزي لكل الاشتراكات على المنصة — بدل ما تدخل جوه كل كورس لوحده
 * عشان تفعّل/تلغي اشتراك طالب. لسه فيه تفعيل يدوي جوه صفحة الكورس نفسها
 * (CourseEnrollmentsTab) لسهولة سياق العمل هناك، لكن الصفحة دي بتدّيك نظرة
 * شاملة على كل الاشتراكات مع بحث وفلترة بالحالة، وتقدر تفعّل/تلغي من هنا
 * مباشرة برضه.
 */
export function EnrollmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdFilter = searchParams.get("studentId") ?? undefined;

  const enrollmentsQuery = useEnrollments({ studentId: studentIdFilter });
  const studentsQuery = useStudents();
  const studentCoursesQuery = useCourses("STUDENT_COURSE");
  const trainingsQuery = useCourses("LAWYER_TRAINING");
  const createEnrollment = useCreateEnrollment();
  const revokeEnrollment = useRevokeEnrollment();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "REVOKED">("");
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const allCourses = useMemo(
    () => [...(studentCoursesQuery.data ?? []), ...(trainingsQuery.data ?? [])],
    [studentCoursesQuery.data, trainingsQuery.data],
  );

  const filteredStudent = (studentsQuery.data ?? []).find((s) => s.id === studentIdFilter);

  const filteredEnrollments = useMemo(() => {
    if (!enrollmentsQuery.data) return enrollmentsQuery.data;
    const query = search.trim().toLowerCase();
    return enrollmentsQuery.data.filter((enrollment) => {
      if (statusFilter && enrollment.status !== statusFilter) return false;
      if (!query) return true;
      return (
        (enrollment.student?.name ?? "").toLowerCase().includes(query) ||
        (enrollment.student?.phone ?? "").includes(query) ||
        (enrollment.course?.title ?? "").toLowerCase().includes(query)
      );
    });
  }, [enrollmentsQuery.data, search, statusFilter]);

  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!enrollStudentId || !enrollCourseId) return;
    try {
      await createEnrollment.mutateAsync({ studentId: enrollStudentId, courseId: enrollCourseId });
      toast.success("تم تفعيل الاشتراك");
      setEnrollStudentId("");
      setEnrollCourseId("");
    } catch (err) {
      setFormError(extractErrorMessage(err));
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
    <div>
      <PageHeader
        title="الاشتراكات"
        description={
          filteredStudent
            ? `اشتراكات "${filteredStudent.name}" في كل الكورسات والدورات`
            : "كل اشتراكات الطلاب في الكورسات والدورات، في مكان واحد"
        }
      />

      {filteredStudent && (
        <button
          onClick={() => setSearchParams({})}
          className="mb-4 text-sm font-medium text-(--color-royal-light) hover:underline"
        >
          إلغاء فلترة الطالب وعرض كل الاشتراكات
        </button>
      )}

      <Card className="mb-4 p-4">
        <form onSubmit={handleEnroll} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-sm font-medium text-(--color-navy)">
              الطالب
            </label>
            <Select value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)}>
              <option value="">اختر طالب...</option>
              {(studentsQuery.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.phone}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-sm font-medium text-(--color-navy)">
              الكورس/الدورة
            </label>
            <Select value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)}>
              <option value="">اختر كورس أو دورة...</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" loading={createEnrollment.isPending} disabled={!enrollStudentId || !enrollCourseId}>
            <UserPlus className="h-4 w-4" />
            تفعيل اشتراك
          </Button>
        </form>
        {formError && (
          <div className="mt-2">
            <ErrorBanner message={formError} />
          </div>
        )}
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الطالب أو رقم الهاتف أو الكورس..."
            className="pr-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "ACTIVE" | "REVOKED")}
          className="w-40"
        >
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="REVOKED">ملغي</option>
        </Select>
      </div>

      {enrollmentsQuery.isLoading && <LoadingState />}
      {enrollmentsQuery.error && <ErrorBanner message={extractErrorMessage(enrollmentsQuery.error)} />}

      {filteredEnrollments && filteredEnrollments.length === 0 && (
        <EmptyState title="مفيش اشتراكات مطابقة" />
      )}

      {filteredEnrollments && filteredEnrollments.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="text-sm font-medium text-(--color-navy)">
                  {enrollment.student?.name}
                </div>
                <div className="text-xs text-(--color-muted)">
                  {enrollment.course?.title} · <span dir="ltr">{enrollment.student?.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-(--color-muted)">
                  {new Date(enrollment.createdAt).toLocaleDateString("ar-EG")}
                </span>
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
