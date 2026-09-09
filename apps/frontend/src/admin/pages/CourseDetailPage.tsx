import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Pencil } from "lucide-react";
import { useCourse, useUpdateCourse } from "../hooks/useCourses";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { LoadingState, ErrorBanner, Badge, Button } from "../components/ui";
import { CourseFormModal } from "../components/CourseFormModal";
import { CourseCoverUploadControl } from "../components/CourseCoverUploadControl";
import { CourseContentTab } from "../components/CourseContentTab";
import { CourseExamsTab } from "../components/CourseExamsTab";
import { CourseAttachmentsTab } from "../components/CourseAttachmentsTab";
import { CourseEnrollmentsTab } from "../components/CourseEnrollmentsTab";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import clsx from "clsx";

type TabKey = "content" | "exams" | "attachments" | "enrollments";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAdminAuth();
  const { data: course, isLoading, error } = useCourse(courseId);
  const updateCourse = useUpdateCourse(courseId ?? "");
  const toast = useToast();

  const [tab, setTab] = useState<TabKey>("content");
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!course) return null;

  const backTo = course.track === "STUDENT_COURSE" ? "/admin/courses" : "/admin/trainings";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "content", label: "المحتوى" },
    { key: "exams", label: "الامتحانات" },
    { key: "attachments", label: "المرفقات" },
    ...(user?.role === "ADMIN"
      ? ([{ key: "enrollments", label: "المشتركين" }] as { key: TabKey; label: string }[])
      : []),
  ];

  return (
    <div>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-navy)"
      >
        <ArrowRight className="h-4 w-4" />
        رجوع للقائمة
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <CourseCoverUploadControl courseId={course.id} coverImageUrl={course.coverImageUrl} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-(--color-navy)">
                {course.title}
              </h1>
              <Badge tone={course.isPublished ? "success" : "neutral"}>
                {course.isPublished ? "منشور" : "مسودة"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-(--color-muted)">
              {course.instructor?.name ?? "بدون مدرب"} · {course.priceEGP} ج.م
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          تعديل بيانات الكورس
        </Button>
      </div>

      <div className="mb-5 flex gap-1 border-b border-(--color-silver-light)">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition",
              tab === t.key
                ? "border-(--color-gold) text-(--color-navy)"
                : "border-transparent text-(--color-muted) hover:text-(--color-navy)",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "content" && <CourseContentTab course={course} />}
      {tab === "exams" && <CourseExamsTab courseId={course.id} />}
      {tab === "attachments" && <CourseAttachmentsTab course={course} />}
      {tab === "enrollments" && user?.role === "ADMIN" && (
        <CourseEnrollmentsTab courseId={course.id} />
      )}

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
    </div>
  );
}
