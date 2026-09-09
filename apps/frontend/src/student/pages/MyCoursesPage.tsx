import { Link } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";
import { useMyEnrollments } from "../hooks/useEnrollments";
import { Card, EmptyState, ErrorBanner, LoadingState, PageHeader } from "../../admin/components/ui";
import { extractErrorMessage } from "../lib/apiClient";

export function MyCoursesPage() {
  const { data: enrollments, isLoading, isError, error } = useMyEnrollments();

  return (
    <div>
      <PageHeader title="كورساتي" description="الكورسات والدورات اللي مشترك فيها" />

      {isLoading && <LoadingState label="بيتم تحميل كورساتك..." />}
      {isError && <ErrorBanner message={extractErrorMessage(error)} />}

      {enrollments && enrollments.length === 0 && (
        <EmptyState
          title="لسه مش مشترك في أي كورس"
          description="لو اشتريت كورس أو دورة، هتظهر هنا. لو عندك استفسار تواصل مع مكي وشركاؤه."
        />
      )}

      {enrollments && enrollments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Link key={enrollment.id} to={`/student/courses/${enrollment.course.slug}`}>
              <Card className="h-full overflow-hidden transition hover:shadow-md">
                <div className="flex h-32 items-center justify-center bg-(--color-navy)">
                  {enrollment.course.coverImageUrl ? (
                    <img
                      src={enrollment.course.coverImageUrl}
                      alt={enrollment.course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : enrollment.course.track === "LAWYER_TRAINING" ? (
                    <GraduationCap className="h-10 w-10 text-(--color-gold)/60" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-(--color-gold)/60" />
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-1 text-xs font-medium text-(--color-gold-dim)">
                    {enrollment.course.track === "LAWYER_TRAINING" ? "دورة تدريبية" : "كورس"}
                  </div>
                  <h3 className="font-display text-base font-semibold text-(--color-navy)">
                    {enrollment.course.title}
                  </h3>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-(--color-muted)">
                      <span>التقدم</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-paper-alt)">
                      <div
                        className="h-full rounded-full bg-(--color-gold)"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-(--color-muted)">
                      {enrollment.completedLessons} من {enrollment.totalLessons} درس
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
