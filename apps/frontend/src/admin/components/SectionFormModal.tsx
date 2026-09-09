import { useState, type FormEvent } from "react";
import { Modal, Field, Input, Select, Button, ErrorBanner } from "./ui";
import { useCreateSection, useUpdateSection } from "../hooks/useSections";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Section } from "../types/api";
import type { EditableSection } from "./SectionNode";

export function SectionFormModal({
  open,
  onClose,
  courseId,
  section,
  parentId,
  allSections,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  section?: EditableSection;
  parentId?: string;
  allSections: Section[];
}) {
  const toast = useToast();
  const isEdit = !!section;
  const createSection = useCreateSection(courseId);
  const updateSection = useUpdateSection(courseId);

  const [title, setTitle] = useState(section?.title ?? "");
  const [order, setOrder] = useState(section?.order?.toString() ?? "0");
  const [selectedParentId, setSelectedParentId] = useState(
    section?.parentId ?? parentId ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateSection.mutateAsync({
          id: section.id,
          title,
          order: Number(order) || 0,
          parentId: selectedParentId || undefined,
        });
        toast.success("تم حفظ التعديلات");
      } else {
        await createSection.mutateAsync({
          title,
          order: Number(order) || 0,
          parentId: selectedParentId || undefined,
        });
        toast.success("تم إنشاء القسم");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل القسم" : "قسم جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="عنوان القسم">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="الترتيب">
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
        <Field label="القسم الأب" hint="اختياري — للأقسام الفرعية">
          <Select value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)}>
            <option value="">بدون (قسم رئيسي)</option>
            {allSections
              .filter((s) => s.id !== section?.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
          </Select>
        </Field>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={createSection.isPending || updateSection.isPending}>
            {isEdit ? "حفظ" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
