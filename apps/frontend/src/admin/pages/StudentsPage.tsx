import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardList } from "lucide-react";
import { Card, Badge, PageHeader, LoadingState, ErrorBanner, EmptyState, Input } from "../components/ui";
import { useStudents, useSetStudentActive } from "../hooks/useStudents";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

export function StudentsPage() {
  const { data: students, isLoading, error } = useStudents();
  const setActive = useSetStudentActive();
  const toast = useToast();
  const [search, setSearch] = useState("");

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await setActive.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? "تم تعطيل الحساب" : "تم تفعيل الحساب");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const filteredStudents = useMemo(() => {
    if (!students) return students;
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      return (
        student.name.toLowerCase().includes(query) ||
        (student.phone ?? "").includes(query) ||
        (student.email ?? "").toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  return (
    <div>
      <PageHeader
        title="الطلاب"
        description="حسابات الطلاب المسجّلين على المنصة — لإدارة اشتراكات طالب معيّن، ادخل صفحة الاشتراكات من الجدول"
      />

      {isLoading && <LoadingState />}
      {error && <ErrorBanner message={extractErrorMessage(error)} />}

      {students && students.length === 0 && <EmptyState title="لسه مفيش طلاب مسجّلين" />}

      {students && students.length > 0 && (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
              className="pr-9"
            />
          </div>

          {filteredStudents && filteredStudents.length === 0 && (
            <EmptyState title="مفيش نتائج مطابقة للبحث" />
          )}

          {filteredStudents && filteredStudents.length > 0 && (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right">
                <thead>
                  <tr className="border-b border-(--color-silver-light) text-xs text-(--color-muted)">
                    <th className="px-4 py-3 font-medium">الاسم</th>
                    <th className="px-4 py-3 font-medium">رقم الهاتف</th>
                    <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الاشتراكات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-(--color-silver-light) last:border-0 hover:bg-(--color-paper-alt)/40"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-(--color-navy)">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-(--color-muted)" dir="ltr">
                        {student.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-(--color-muted)" dir="ltr">
                        {student.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggle(student.id, student.isActive)}>
                          <Badge tone={student.isActive ? "success" : "danger"}>
                            {student.isActive ? "نشط" : "معطّل"}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/enrollments?studentId=${student.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-royal-light) hover:underline"
                        >
                          <ClipboardList className="h-4 w-4" />
                          عرض
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
