import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Users, Award, Wallet, ArrowLeft } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import { Card, LoadingState, PageHeader } from "../components/ui";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { usePaymentsStatsAdmin } from "../hooks/usePayments";
import type { Course, Enrollment, Student } from "../types/api";

function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="flex items-center gap-4 p-5 transition hover:border-(--color-gold)/40 hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-navy)/5">
          <Icon className="h-6 w-6 text-(--color-navy)" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-(--color-navy)">{value}</div>
          <div className="text-sm text-(--color-muted)">{label}</div>
        </div>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAdminAuth();
  const isAdmin = user?.role === "ADMIN";

  const coursesQuery = useQuery({
    queryKey: ["courses", "admin", "all"],
    queryFn: async () => (await apiClient.get<Course[]>("/courses/all")).data,
  });

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await apiClient.get<Student[]>("/students/all")).data,
    enabled: isAdmin,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "all"],
    queryFn: async () => (await apiClient.get<Enrollment[]>("/enrollments")).data,
    enabled: isAdmin,
  });

  const paymentsStatsQuery = usePaymentsStatsAdmin();

  if (coursesQuery.isLoading) return <LoadingState />;

  const courses = coursesQuery.data ?? [];
  const studentCourses = courses.filter((c) => c.track === "STUDENT_COURSE");
  const trainings = courses.filter((c) => c.track === "LAWYER_TRAINING");
  const allEnrollments = enrollmentsQuery.data ?? [];
  const recentEnrollments = allEnrollments.slice(0, 6);
  const activeEnrollmentsCount = allEnrollments.filter((e) => e.status === "ACTIVE").length;

  return (
    <div>
      <PageHeader
        title={`أهلًا، ${user?.name ?? ""}`}
        description="نظرة عامة سريعة على المنصة"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="الكورسات" value={studentCourses.length} to="/admin/courses" />
        <StatCard icon={GraduationCap} label="الدورات التدريبية" value={trainings.length} to="/admin/trainings" />
        {isAdmin && (
          <StatCard icon={Users} label="الطلاب" value={studentsQuery.data?.length ?? "—"} to="/admin/students" />
        )}
        {isAdmin && (
          <StatCard icon={Award} label="الاشتراكات النشطة" value={activeEnrollmentsCount} to="/admin/students" />
        )}
        {isAdmin && (
          <StatCard
            icon={Wallet}
            label="إجمالي الإيرادات"
            value={
              paymentsStatsQuery.data
                ? `${paymentsStatsQuery.data.totalRevenueEGP.toLocaleString("ar-EG")} جنيه`
                : "—"
            }
            to="/admin/payments"
          />
        )}
      </div>

      {isAdmin && (
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-(--color-navy)">
              أحدث الاشتراكات
            </h2>
            <Link
              to="/admin/students"
              className="flex items-center gap-1 text-sm font-medium text-(--color-royal-light) hover:underline"
            >
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentEnrollments.length === 0 ? (
            <p className="text-sm text-(--color-muted)">لسه مفيش اشتراكات مسجّلة.</p>
          ) : (
            <div className="divide-y divide-(--color-silver-light)">
              {recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-(--color-navy)">
                      {enrollment.student?.name}
                    </span>
                    <span className="text-(--color-muted)"> — {enrollment.course?.title}</span>
                  </div>
                  <span className="text-xs text-(--color-muted)">
                    {new Date(enrollment.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
