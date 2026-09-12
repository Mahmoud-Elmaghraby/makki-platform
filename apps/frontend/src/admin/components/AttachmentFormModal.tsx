import { useRef, useState, type FormEvent } from "react";
import { Modal, Field, Input, Select, Button, ErrorBanner } from "./ui";
import { useCreateAttachment } from "../hooks/useAttachments";
import { uploadVideoFile } from "../hooks/useLessons";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Lesson, Section } from "../types/api";

export function AttachmentFormModal({
  open,
  onClose,
  courseId,
  sections,
  lessons,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  sections: Section[];
  lessons: Lesson[];
}) {
  const toast = useToast();
  const createAttachment = useCreateAttachment(courseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("لازم تختار ملف");
      return;
    }
    try {
      const { uploadUrl, uploadFields } = await createAttachment.mutateAsync({
        title,
        fileName: file.name,
        fileSizeBytes: file.size,
        sectionId: sectionId || undefined,
        lessonId: lessonId || undefined,
      });
      setUploading(true);
      await uploadVideoFile(uploadUrl, uploadFields, file);
      toast.success("تم رفع المرفق");
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="مرفق جديد">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="عنوان المرفق">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="الملف">
          <input
            ref={fileInputRef}
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-(--color-navy) file:mr-3 file:rounded-lg file:border-0 file:bg-(--color-paper-alt) file:px-3 file:py-2 file:text-sm file:font-medium file:text-(--color-navy)"
          />
        </Field>
        <Field label="مرتبط بقسم" hint="اختياري">
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">بدون</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="مرتبط بدرس" hint="اختياري">
          <Select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">بدون</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
        </Field>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={createAttachment.isPending || uploading}>
            رفع
          </Button>
        </div>
      </form>
    </Modal>
  );
}
