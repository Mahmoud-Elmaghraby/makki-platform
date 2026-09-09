import { useState, type FormEvent } from "react";
import { Modal, Field, Input, Textarea, Button, ErrorBanner } from "./ui";
import { VideoUploadControl } from "./VideoUploadControl";
import { useCreateLesson, useUpdateLesson } from "../hooks/useLessons";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Lesson } from "../types/api";

export function LessonFormModal({
  open,
  onClose,
  courseId,
  sectionId,
  lesson,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  sectionId?: string;
  lesson?: Lesson;
}) {
  const toast = useToast();
  const isEdit = !!lesson;
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [order, setOrder] = useState(lesson?.order?.toString() ?? "0");
  const [isFreePreview, setIsFreePreview] = useState(lesson?.isFreePreview ?? false);
  const [isPublished, setIsPublished] = useState(lesson?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);

  // بعد إنشاء الدرس بنجاح، بنحط بياناته هنا عشان نعرض تحكم رفع الفيديو
  // جوه نفس المودال من غير ما نقفله.
  const [createdLesson, setCreatedLesson] = useState<{ id: string; uploadUrl: string } | null>(
    null,
  );

  function reset() {
    setTitle("");
    setDescription("");
    setOrder("0");
    setIsFreePreview(false);
    setIsPublished(false);
    setCreatedLesson(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateLesson.mutateAsync({
          id: lesson.id,
          title,
          description: description || undefined,
          order: Number(order) || 0,
          isFreePreview,
          isPublished,
        });
        toast.success("تم حفظ التعديلات");
        handleClose();
      } else {
        const { lesson: created, uploadUrl } = await createLesson.mutateAsync({
          title,
          description: description || undefined,
          order: Number(order) || 0,
          isFreePreview,
          isPublished,
          sectionId,
        });
        toast.success("تم إنشاء الدرس — دلوقتي ارفع الفيديو");
        setCreatedLesson({ id: created.id, uploadUrl });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "تعديل الدرس" : "درس جديد"}
      widthClassName="max-w-lg"
    >
      {createdLesson ? (
        <div className="space-y-4">
          <p className="text-sm text-(--color-muted)">
            الدرس اتعمل بنجاح. دلوقتي ارفع ملف الفيديو (أو اقفل واعمل ده بعدين من زرار
            "رفع فيديو" جنب الدرس).
          </p>
          <VideoUploadControl
            courseId={courseId}
            lessonId={createdLesson.id}
            initialUploadUrl={createdLesson.uploadUrl}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>تم</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="عنوان الدرس">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="الوصف" hint="اختياري">
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="الترتيب">
            <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-(--color-navy)">
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                className="h-4 w-4 rounded border-(--color-silver)"
              />
              معاينة مجانية
            </label>
            <label className="flex items-center gap-2 text-sm text-(--color-navy)">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-(--color-silver)"
              />
              منشور
            </label>
          </div>

          {error && <ErrorBanner message={error} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={createLesson.isPending || updateLesson.isPending}>
              {isEdit ? "حفظ" : "إنشاء ومتابعة الرفع"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
