import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Field, Input, Textarea, Select, Button, ErrorBanner } from "./ui";
import { useAddCheckpoint, useUpdateCheckpoint } from "../hooks/useCheckpoints";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Checkpoint, CheckpointOption, CheckpointQuestionType } from "../types/api";

let optionSeq = 1;
function newOption(): CheckpointOption {
  return { id: `opt-${Date.now()}-${optionSeq++}`, text: "" };
}

export function CheckpointFormModal({
  open,
  onClose,
  courseId,
  lessonId,
  checkpoint,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  checkpoint?: Checkpoint;
}) {
  const toast = useToast();
  const isEdit = !!checkpoint;
  const addCheckpoint = useAddCheckpoint(courseId, lessonId);
  const updateCheckpoint = useUpdateCheckpoint(courseId, lessonId);

  const [type, setType] = useState<CheckpointQuestionType>(checkpoint?.type ?? "MULTIPLE_CHOICE");
  const [question, setQuestion] = useState(checkpoint?.question ?? "");
  // بنعرض التوقيت للأدمن كدقايق:ثواني (أسهل من ثانية خام)، وبنحوّله لثواني
  // بس عند الحفظ — الـ API متوقّع timestampSeconds كرقم صحيح.
  const [minutes, setMinutes] = useState(
    checkpoint ? Math.floor(checkpoint.timestampSeconds / 60).toString() : "0",
  );
  const [seconds, setSeconds] = useState(
    checkpoint ? (checkpoint.timestampSeconds % 60).toString() : "0",
  );
  const [order, setOrder] = useState(checkpoint?.order?.toString() ?? "0");
  const [options, setOptions] = useState<CheckpointOption[]>(
    checkpoint?.options && checkpoint.options.length > 0
      ? checkpoint.options
      : [newOption(), newOption()],
  );
  const [correctOptionId, setCorrectOptionId] = useState(checkpoint?.correctOptionId ?? "");
  const [correctBoolean, setCorrectBoolean] = useState<boolean>(checkpoint?.correctBoolean ?? true);
  const [error, setError] = useState<string | null>(null);

  function updateOptionText(id: string, value: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text: value } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, newOption()]);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    if (correctOptionId === id) setCorrectOptionId("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (type === "MULTIPLE_CHOICE" && (!correctOptionId || options.some((o) => !o.text.trim()))) {
      setError("لازم كل الاختيارات تتملى وتحدد الإجابة الصحيحة");
      return;
    }

    const timestampSeconds = (Number(minutes) || 0) * 60 + (Number(seconds) || 0);

    const input = {
      timestampSeconds,
      question,
      type,
      order: Number(order) || 0,
      options: type === "MULTIPLE_CHOICE" ? options : undefined,
      correctOptionId: type === "MULTIPLE_CHOICE" ? correctOptionId : undefined,
      correctBoolean: type === "TRUE_FALSE" ? correctBoolean : undefined,
    };

    try {
      if (isEdit) {
        await updateCheckpoint.mutateAsync({ id: checkpoint.id, ...input });
        toast.success("تم حفظ التعديلات");
      } else {
        await addCheckpoint.mutateAsync(input);
        toast.success("تم إضافة السؤال");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل سؤال الفيديو" : "سؤال جديد داخل الفيديو"}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="توقيت ظهور السؤال في الفيديو" hint="الفيديو هيوقف تلقائي عند اللحظة دي">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-20"
            />
            <span className="text-sm text-(--color-muted)">دقيقة</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="w-20"
            />
            <span className="text-sm text-(--color-muted)">ثانية</span>
          </div>
        </Field>

        <Field label="نوع السؤال">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as CheckpointQuestionType)}
            disabled={isEdit}
          >
            <option value="MULTIPLE_CHOICE">اختيار من متعدد</option>
            <option value="TRUE_FALSE">صح / خطأ</option>
          </Select>
        </Field>

        <Field label="نص السؤال">
          <Textarea required rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
        </Field>

        <Field label="الترتيب" hint="لو أكتر من سؤال في نفس الثانية تقريبًا">
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-24" />
        </Field>

        {type === "MULTIPLE_CHOICE" && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-(--color-navy)">
              الاختيارات (حدد الإجابة الصحيحة)
            </span>
            {options.map((option, idx) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctOptionId === option.id}
                  onChange={() => setCorrectOptionId(option.id)}
                  className="h-4 w-4 shrink-0"
                />
                <Input
                  required
                  value={option.text}
                  onChange={(e) => updateOptionText(option.id, e.target.value)}
                  placeholder={`اختيار ${idx + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    className="shrink-0 rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={addOption}>
              <Plus className="h-3.5 w-3.5" />
              إضافة اختيار
            </Button>
          </div>
        )}

        {type === "TRUE_FALSE" && (
          <Field label="الإجابة الصحيحة">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={correctBoolean === true}
                  onChange={() => setCorrectBoolean(true)}
                />
                صح
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={correctBoolean === false}
                  onChange={() => setCorrectBoolean(false)}
                />
                خطأ
              </label>
            </div>
          </Field>
        )}

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={addCheckpoint.isPending || updateCheckpoint.isPending}>
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
