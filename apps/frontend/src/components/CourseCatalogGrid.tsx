import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { usePublicCourses, type PublicCourseSummary } from "../hooks/usePublicCourses";
import { LoadingState, ErrorBanner, EmptyState } from "../admin/components/ui";
import { extractErrorMessage } from "../student/lib/apiClient";
import type { CourseTrack } from "../student/types/api";
import type { Faculty, AcademicYear } from "../lib/academicTaxonomy";

function formatPrice(priceEGP: number) {
  return `${priceEGP.toLocaleString("ar-EG")} جنيه`;
}

function CourseCard({ course }: { course: PublicCourseSummary }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-(--color-silver) bg-white transition hover:border-(--color-gold) hover:shadow-lg"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-(--color-navy)">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <GraduationCap className="h-10 w-10 text-(--color-gold)/60" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-bold text-(--color-navy)">{course.title}</h3>
        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-(--color-muted)">
            {course.description}
          </p>
        )}
        <div className="mt-4 flex flex-1 items-end justify-between gap-3 pt-2">
          <span className="text-xs text-(--color-muted)">
            {course.instructor?.name ?? "مكي وشركاؤه"} · {course._count.lessons} درس
          </span>
          <span className="shrink-0 rounded-full bg-(--color-gold)/10 px-3 py-1 text-xs font-bold text-(--color-gold-dim)">
            {formatPrice(course.priceEGP)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * شبكة عرض الكورسات/الدورات — مستخدمة في صفحتين منفصلتين تمامًا: "كورساتنا"
 * (STUDENT_COURSE) و"دوراتنا التدريبية" (LAWYER_TRAINING)، كل واحدة بمسارها
 * الخاص (`/courses` و`/trainings`) بدل ما يكونوا قسمين في صفحة واحدة.
 */
export function CourseCatalogGrid({
  track,
  faculty,
  academicYear,
  q,
}: {
  track: CourseTrack;
  faculty?: Faculty;
  academicYear?: AcademicYear;
  q?: string;
}) {
  const { data, isLoading, isError, error } = usePublicCourses(track, { faculty, academicYear, q });

  if (isLoading) return <LoadingState label="بيتم تحميل البرامج..." />;
  if (isError) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={q ? "مفيش نتائج مطابقة لبحثك" : "لسه مفيش برامج منشورة هنا"}
        description={q ? "جرّب كلمة تانية أو تأكد من الإملاء." : "تابعنا، هنعلن أول ما التسجيل يفتح."}
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
