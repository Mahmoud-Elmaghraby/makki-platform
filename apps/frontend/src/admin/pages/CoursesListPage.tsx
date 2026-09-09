import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  LoadingState,
  EmptyState,
  ErrorBanner,
  Input,
} from "../components/ui";
import { CourseFormModal } from "../components/CourseFormModal";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "../hooks/useCourses";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Course, CourseTrack } from "../types/api";
import { FACULTY_LABELS, ACADEMIC_YEAR_LABELS } from "../../lib/academicTaxonomy";

function CourseRow({ course, showFacultyColumn }: { course: Course; showFacultyColumn: boolean }) {
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const updateCourse = useUpdateCourse(course.id);
  const deleteCourse = useDeleteCourse();

  async function togglePublish() {
    try {
      await updateCourse.mutateAsync({ isPublished: !course.isPublished });
      toast.success(course.isPublished ? "تم إخفاء الكورس" : "تم نشر الكورس");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!confirm(`متأكد إنك عايز تمسح "${course.title}"؟ الإجراء ده مينفعش يترجع فيه.`)) return;
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success("تم حذف الكورس");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <>
      <tr className="border-b border-(--color-silver-light) last:border-0 hover:bg-(--color-paper-alt)/40">
        <td className="px-4 py-3">
          <Link
            to={`/admin/courses/${course.id}`}
            className="font-medium text-(--color-navy) hover:text-(--color-royal-light) hover:underline"
          >
            {course.title}
          </Link>
          <div className="text-xs text-(--color-muted)" dir="ltr">
            /{course.slug}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-(--color-muted)">
          {course.instructor?.name ?? "—"}
        </td>
        {showFacultyColumn && (
          <td className="px-4 py-3 text-sm text-(--color-muted)">
            {course.faculty
              ? `${FACULTY_LABELS[course.faculty]}${course.academicYear ? ` — ${ACADEMIC_YEAR_LABELS[course.academicYear]}` : ""}`
              : "—"}
          </td>
        )}
        <td className="px-4 py-3 text-sm text-(--color-navy)">{course.priceEGP} ج.م</td>
        <td className="px-4 py-3">
          <Badge tone={course.isPublished ? "success" : "neutral"}>
            {course.isPublished ? "منشور" : "مسودة"}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={togglePublish}
              title={course.isPublished ? "إخفاء" : "نشر"}
              className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
            >
              {course.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              title="تعديل"
              className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              title="حذف"
              className="rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      <CourseFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        track={course.track}
        course={course}
        submitting={updateCourse.isPending}
        onSubmit={async (input) => {
          await updateCourse.mutateAsync(input);
          toast.success("تم حفظ التعديلات");
        }}
      />
    </>
  );
}

export function CoursesListPage({ track }: { track: CourseTrack }) {
  const { data: courses, isLoading, error } = useCourses(track);
  const createCourse = useCreateCourse();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const title = track === "STUDENT_COURSE" ? "الكورسات" : "الدورات التدريبية";
  const description =
    track === "STUDENT_COURSE"
      ? "كورسات لطلاب كلية الحقوق"
      : "دورات تدريبية للمحامين المتخرجين";

  const filteredCourses = useMemo(() => {
    if (!courses) return courses;
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(query) ||
        (course.instructor?.name ?? "").toLowerCase().includes(query)
      );
    });
  }, [courses, search]);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {track === "STUDENT_COURSE" ? "كورس جديد" : "دورة جديدة"}
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorBanner message={extractErrorMessage(error)} />}

      {courses && courses.length === 0 && (
        <EmptyState
          title="لسه معملتش حاجة هنا"
          description="ابدأ بإضافة أول كورس أو دورة، وبعدين تقدر تضيف أقسام ودروس وامتحانات."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              إضافة الآن
            </Button>
          }
        />
      )}

      {courses && courses.length > 0 && (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالعنوان أو اسم المدرب..."
              className="pr-9"
            />
          </div>

          {filteredCourses && filteredCourses.length === 0 && (
            <EmptyState title="مفيش نتائج مطابقة للبحث" />
          )}

          {filteredCourses && filteredCourses.length > 0 && (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-right">
                <thead>
                  <tr className="border-b border-(--color-silver-light) text-xs text-(--color-muted)">
                    <th className="px-4 py-3 font-medium">العنوان</th>
                    <th className="px-4 py-3 font-medium">المدرب</th>
                    {track === "STUDENT_COURSE" && (
                      <th className="px-4 py-3 font-medium">الكلية / الفرقة</th>
                    )}
                    <th className="px-4 py-3 font-medium">السعر</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <CourseRow key={course.id} course={course} showFacultyColumn={track === "STUDENT_COURSE"} />
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      <CourseFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        track={track}
        submitting={createCourse.isPending}
        onSubmit={async (input) => {
          await createCourse.mutateAsync(input);
          toast.success("تم إنشاء الكورس");
        }}
      />
    </div>
  );
}
