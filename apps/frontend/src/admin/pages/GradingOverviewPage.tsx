import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { apiClient, extractErrorMessage } from "../lib/apiClient";
import { usePublishedExamsAcrossCourses } from "../hooks/useGrading";
import { Card, LoadingState, ErrorBanner, EmptyState, PageHeader } from "../components/ui";
import type { Course } from "../types/api";

export function GradingOverviewPage() {
  const coursesQuery = useQuery({
    queryKey: ["courses", "admin", "all"],
    queryFn: async () => (await apiClient.get<Course[]>("/courses/all")).data,
  });

  const courseIds = (coursesQuery.data ?? []).map((c) => c.id);
  const examsQuery = usePublishedExamsAcrossCourses(courseIds);

  if (coursesQuery.isLoading || examsQuery.isLoading) return <LoadingState />;
  if (coursesQuery.error) return <ErrorBanner message={extractErrorMessage(coursesQuery.error)} />;
  if (examsQuery.error) return <ErrorBanner message={extractErrorMessage(examsQuery.error)} />;

  const courseTitleById = new Map((coursesQuery.data ?? []).map((c) => [c.id, c.title]));
  const examsWithAttempts = (examsQuery.data ?? []).filter((exam) => (exam._count?.attempts ?? 0) > 0);

  return (
    <div>
      <PageHeader
        title="تصحيح الامتحانات"
        description="امتحانات فيها محاولات من الطلاب — ادخل عليها عشان تصحح المقالي منها"
      />

      {examsWithAttempts.length === 0 && (
        <EmptyState title="لسه مفيش محاولات محتاجة تصحيح" />
      )}

      {examsWithAttempts.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {examsWithAttempts.map((exam) => (
            <Link
              key={exam.id}
              to={`/admin/courses/${exam.courseId}/exams/${exam.id}/attempts`}
              className="flex items-center justify-between gap-3 p-4 hover:bg-(--color-paper-alt)/40"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-(--color-muted)" />
                <div>
                  <div className="text-sm font-medium text-(--color-navy)">{exam.title}</div>
                  <div className="text-xs text-(--color-muted)">
                    {courseTitleById.get(exam.courseId) ?? ""}
                  </div>
                </div>
              </div>
              <span className="text-xs text-(--color-muted)">
                {exam._count?.attempts ?? 0} محاولة
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
