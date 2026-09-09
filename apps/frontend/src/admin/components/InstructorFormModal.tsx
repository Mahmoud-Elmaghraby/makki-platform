import { useState, type FormEvent } from "react";
import { Modal, Field, Input, Textarea, Button, ErrorBanner } from "./ui";
import { useCreateInstructor, useUpdateInstructor } from "../hooks/useInstructors";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Instructor } from "../types/api";

export function InstructorFormModal({
  open,
  onClose,
  instructor,
}: {
  open: boolean;
  onClose: () => void;
  instructor?: Instructor;
}) {
  const toast = useToast();
  const isEdit = !!instructor;
  const createInstructor = useCreateInstructor();
  const updateInstructor = useUpdateInstructor();

  const [name, setName] = useState(instructor?.name ?? "");
  const [email, setEmail] = useState(instructor?.user?.email ?? "");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState(instructor?.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(instructor?.photoUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateInstructor.mutateAsync({
          id: instructor.id,
          name,
          bio: bio || undefined,
          photoUrl: photoUrl || undefined,
        });
        toast.success("تم حفظ التعديلات");
      } else {
        await createInstructor.mutateAsync({
          name,
          email,
          password,
          bio: bio || undefined,
          photoUrl: photoUrl || undefined,
        });
        toast.success("تم إنشاء حساب المدرب");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل بيانات المدرب" : "مدرب جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="الاسم">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        {!isEdit && (
          <>
            <Field label="البريد الإلكتروني" hint="هيستخدمه المدرب لتسجيل الدخول">
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
          </>
        )}

        <Field label="نبذة تعريفية" hint="اختياري">
          <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>

        <Field label="رابط الصورة الشخصية" hint="اختياري">
          <Input dir="ltr" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        </Field>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={createInstructor.isPending || updateInstructor.isPending}>
            {isEdit ? "حفظ" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
