import { useState, type FormEvent } from "react";
import { Modal, Field, Input, Textarea, Select, Button, ErrorBanner } from "./ui";
import { useCreateExam, useUpdateExam } from "../hooks/useExams";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Exam, Section } from "../types/api";

export function ExamFormModal({
  open,
  onClose,
  courseId,
  exam,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  exam?: Exam;
  sections: Section[];
}) {
  const toast = useToast();
  const isEdit = !!exam;
  const createExam = useCreateExam(courseId);
  const updateExam = useUpdateExam(courseId);

  const [title, setTitle] = useState(exam?.title ?? "");
  const [description, setDescription] = useState(exam?.description ?? "");
  const [sectionId, setSectionId] = useState(exam?.sectionId ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    exam?.durationMinutes?.toString() ?? "",
  );
  const [passingScore, setPassingScore] = useState(exam?.passingScore?.toString() ?? "");
  const [maxAttempts, setMaxAttempts] = useState(exam?.maxAttempts?.toString() ?? "");
  const [isPublished, setIsPublished] = useState(exam?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      title,
      description: description || undefined,
      sectionId: sectionId || undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      passingScore: passingScore ? Number(passingScore) : undefined,
      maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
      isPublished,
    };
    try {
      if (isEdit) {
        await updateExam.mutateAsync({ id: exam.id, ...input });
        toast.success("تم حفظ التعديلات");
      } else {
        await createExam.mutateAsync(input);
        toast.success("تم إنشاء الامتحان");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل الامتحان" : "امتحان جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="عنوان الامتحان">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="الوصف" hint="اختياري">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="القسم المرتبط" hint="اختياري — سيبه فاضي لو امتحان نهائي على الكورس كله">
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">بدون قسم (امتحان عام على الكورس)</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="المدة (دقايق)" hint="اختياري">
            <Input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </Field>
          <Field label="درجة النجاح" hint="شرط صرف الشهادة">
            <Input
              type="number"
              min={0}
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
            />
          </Field>
        </div>
        <Field label="أقصى عدد محاولات" hint="اختياري — سيبه فاضي يعني بلا حدود">
          <Input
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-(--color-navy)">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-(--color-silver)"
          />
          منشور ومتاح للطلاب
        </label>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={createExam.isPending || updateExam.isPending}>
            {isEdit ? "حفظ" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
