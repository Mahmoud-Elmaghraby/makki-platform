import { useState, type FormEvent } from "react";
import { Modal, Field, Input, Textarea, Select, Button, ErrorBanner } from "./ui";
import { InstructorPhotoUploadControl } from "./InstructorPhotoUploadControl";
import { useCreateUser, useUpdateUser } from "../hooks/useUsers";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Role, StaffUser } from "../types/api";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "أدمن",
  MANAGER: "مدير",
  INSTRUCTOR: "مدرب",
};

export function UserFormModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user?: StaffUser;
}) {
  const toast = useToast();
  const isEdit = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "INSTRUCTOR");
  const [bio, setBio] = useState(user?.instructor?.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(user?.instructor?.photoUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  // في وضع التعديل، حقول النبذة/الصورة بتظهر بس لو الحساب ده أصلاً مدرب —
  // مينفعش تحوّل حساب لمدرب بعد إنشائه (نفس قيد الباك إند، شوف UpdateUserDto).
  const showInstructorFields = isEdit ? !!user?.instructor : role === "INSTRUCTOR";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateUser.mutateAsync({
          id: user.id,
          name,
          password: password || undefined,
          bio: showInstructorFields ? bio || undefined : undefined,
          // في وضع التعديل، الصورة بقت بتتحدّث لوحدها فورًا عن طريق
          // InstructorPhotoUploadControl (مسار رفع منفصل تمامًا). لو بعتنا
          // photoUrl هنا كمان، هيتبعت بالقيمة القديمة المحفوظة في الـ state
          // من وقت ما النافذة اتفتحت، وده ممكن يمسح فوق الصورة الجديدة اللي
          // اترفعت لسه (باگ فعلي اتكشف وقت الاختبار).
          photoUrl: undefined,
        });
        toast.success("تم حفظ التعديلات");
      } else {
        await createUser.mutateAsync({
          name,
          email,
          password,
          role,
          bio: showInstructorFields ? bio || undefined : undefined,
          photoUrl: showInstructorFields ? photoUrl || undefined : undefined,
        });
        toast.success("تم إنشاء الحساب");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل بيانات المستخدم" : "مستخدم جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="الاسم">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        {!isEdit && (
          <>
            <Field label="البريد الإلكتروني" hint="هيستخدمه المستخدم لتسجيل الدخول">
              <Input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="كلمة السر المبدئية">
              <Input
                type="text"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="الدور">
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {isEdit && (
          <Field label="كلمة سر جديدة" hint="سيبها فاضية لو مش عايز تغيّرها">
            <Input
              type="text"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        )}

        {showInstructorFields && (
          <>
            <Field label="نبذة تعريفية" hint="اختياري — بتظهر في صفحة الكورس العامة">
              <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>

            {isEdit && user?.instructor ? (
              <Field label="صورة المدرب">
                <InstructorPhotoUploadControl
                  instructorId={user.instructor.id}
                  photoUrl={user.instructor.photoUrl}
                />
              </Field>
            ) : (
              <Field
                label="رابط الصورة الشخصية"
                hint="اختياري — تقدر ترفع الصورة مباشرة بعد إنشاء الحساب من نافذة التعديل"
              >
                <Input dir="ltr" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
              </Field>
            )}
          </>
        )}

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={createUser.isPending || updateUser.isPending}>
            {isEdit ? "حفظ" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
