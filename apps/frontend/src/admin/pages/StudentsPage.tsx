import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardList, UserPlus, KeyRound } from "lucide-react";
import { Button, Card, Badge, PageHeader, LoadingState, ErrorBanner, EmptyState, Input, Field, Modal } from "../components/ui";
import {
  useStudents,
  useSetStudentActive,
  useCreateStudent,
  useResetStudentPassword,
  useCreateEnrollment,
} from "../hooks/useStudents";
import { useCourses } from "../hooks/useCourses";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

export function StudentsPage() {
  const { data: students, isLoading, error } = useStudents();
  const setActive = useSetStudentActive();
  const toast = useToast();
  const [search, setSearch] = useState("");

  const createStudent = useCreateStudent();
  const resetPassword = useResetStudentPassword();
  const createEnrollment = useCreateEnrollment();
  const { data: courseList } = useCourses("STUDENT_COURSE");
  const { data: trainingList } = useCourses("LAWYER_TRAINING");
  const allCourses = [...(courseList ?? []), ...(trainingList ?? [])];

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  // بيانات الدخول بتظهر مرة واحدة بس للأدمن عشان يبعتها للطالب.
  const [credentials, setCredentials] = useState<{
    name: string;
    phone: string;
    password: string;
    note?: string;
  } | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    try {
      const res = await createStudent.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
      });
      let note: string | undefined;
      if (newCourseId) {
        try {
          await createEnrollment.mutateAsync({ studentId: res.student.id, courseId: newCourseId });
          note = "تم اشتراكه في الكورس المختار.";
        } catch (err) {
          note = `الحساب اتعمل، لكن الاشتراك فشل: ${extractErrorMessage(err)}`;
        }
      }
      setCredentials({
        name: res.student.name,
        phone: res.student.phone ?? newPhone,
        password: res.temporaryPassword,
        note,
      });
      setAddOpen(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewCourseId("");
    } catch (err) {
      setAddError(extractErrorMessage(err));
    }
  }

  async function handleReset(id: string, name: string, phone: string | null) {
    if (!confirm(`هتغيّر كلمة سر "${name}" لكلمة مؤقتة جديدة؟ الكلمة القديمة هتبطل تشتغل.`)) return;
    try {
      const res = await resetPassword.mutateAsync(id);
      setCredentials({ name, phone: phone ?? "", password: res.temporaryPassword });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

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
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="ml-1 h-4 w-4" />
            إضافة طالب
          </Button>
        }
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة طالب يدوي">
        <form onSubmit={handleAdd} className="space-y-4">
          <Field label="الاسم">
            <Input required value={newName} onChange={(e) => setNewName(e.target.value)} />
          </Field>
          <Field label="رقم التليفون" hint="رقم مصري صحيح، وده اللي هيسجّل بيه دخول">
            <Input
              required
              dir="ltr"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="01012345678"
            />
          </Field>
          <Field label="الإيميل (اختياري)">
            <Input type="email" dir="ltr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </Field>
          <Field label="اشتراك في كورس (اختياري)">
            <select
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
              className="w-full rounded-lg border border-(--color-silver) bg-white px-3 py-2 text-sm"
            >
              <option value="">من غير اشتراك دلوقتي</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          {addError && <ErrorBanner message={addError} />}
          <Button type="submit" className="w-full" loading={createStudent.isPending}>
            إنشاء الحساب
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="بيانات دخول الطالب"
      >
        {credentials && (
          <div className="space-y-3 text-sm">
            <p className="text-(--color-muted)">
              ابعت البيانات دي للطالب. كلمة السر بتظهر مرة واحدة بس ومش هتقدر تشوفها تاني.
            </p>
            <div className="rounded-lg bg-(--color-paper-alt) p-4 leading-7" dir="rtl">
              <div>الاسم: {credentials.name}</div>
              <div dir="ltr" className="text-right">رقم الدخول: {credentials.phone}</div>
              <div dir="ltr" className="text-right font-mono text-base font-bold">
                كلمة السر: {credentials.password}
              </div>
            </div>
            {credentials.note && <p className="text-(--color-muted)">{credentials.note}</p>}
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(`رقم الدخول: ${credentials.phone}\nكلمة السر: ${credentials.password}`)
                  .then(() => toast.success("اتنسخت"))
                  .catch(() => undefined);
              }}
            >
              نسخ البيانات
            </Button>
          </div>
        )}
      </Modal>

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
                    <th className="px-4 py-3 font-medium">كلمة السر</th>
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReset(student.id, student.name, student.phone)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-royal-light) hover:underline"
                        >
                          <KeyRound className="h-4 w-4" />
                          إعادة تعيين
                        </button>
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
