import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Field, Input, Textarea, Select, Button, ErrorBanner } from "./ui";
import { useAddQuestion, useUpdateQuestion } from "../hooks/useExams";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Question, QuestionOption, QuestionType } from "../types/api";

let optionSeq = 1;
function newOption(): QuestionOption {
  return { id: `opt-${Date.now()}-${optionSeq++}`, text: "" };
}

export function QuestionFormModal({
  open,
  onClose,
  courseId,
  examId,
  question,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  examId: string;
  question?: Question;
}) {
  const toast = useToast();
  const isEdit = !!question;
  const addQuestion = useAddQuestion(courseId, examId);
  const updateQuestion = useUpdateQuestion(courseId, examId);

  const [type, setType] = useState<QuestionType>(question?.type ?? "MULTIPLE_CHOICE");
  const [text, setText] = useState(question?.text ?? "");
  const [points, setPoints] = useState(question?.points?.toString() ?? "1");
  const [order, setOrder] = useState(question?.order?.toString() ?? "0");
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options && question.options.length > 0
      ? question.options
      : [newOption(), newOption()],
  );
  const [correctOptionId, setCorrectOptionId] = useState(question?.correctOptionId ?? "");
  const [correctBoolean, setCorrectBoolean] = useState<boolean>(question?.correctBoolean ?? true);
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

    const input = {
      type,
      text,
      order: Number(order) || 0,
      points: Number(points) || 1,
      options: type === "MULTIPLE_CHOICE" ? options : undefined,
      correctOptionId: type === "MULTIPLE_CHOICE" ? correctOptionId : undefined,
      correctBoolean: type === "TRUE_FALSE" ? correctBoolean : undefined,
    };

    try {
      if (isEdit) {
        await updateQuestion.mutateAsync({ id: question.id, ...input });
        toast.success("تم حفظ التعديلات");
      } else {
        await addQuestion.mutateAsync(input);
        toast.success("تم إضافة السؤال");
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "تعديل السؤال" : "سؤال جديد"} widthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="نوع السؤال">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            disabled={isEdit}
          >
            <option value="MULTIPLE_CHOICE">اختيار من متعدد</option>
            <option value="TRUE_FALSE">صح / خطأ</option>
            <option value="ESSAY">مقالي</option>
          </Select>
        </Field>

        <Field label="نص السؤال">
          <Textarea required rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="الدرجة">
            <Input type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} />
          </Field>
          <Field label="الترتيب">
            <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
        </div>

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

        {type === "ESSAY" && (
          <p className="text-xs text-(--color-muted)">
            السؤال المقالي بيتصحح يدويًا بعد ما الطالب يسلّم الامتحان.
          </p>
        )}

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={addQuestion.isPending || updateQuestion.isPending}>
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
