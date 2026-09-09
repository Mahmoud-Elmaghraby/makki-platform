import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * صندوق بحث عام لصفحتي "كورساتنا" و"دوراتنا التدريبية" — بيبحث بالعنوان
 * والوصف عن طريق ?q= في GET /courses (راجع course.service.ts::findPublished).
 * بيعمل debounce بسيط (350ms) عشان ملطلقش طلب API مع كل ضغطة حرف.
 */
export function CourseSearchBox({
  value,
  onChange,
  placeholder = "دوّر عن كورس أو دورة... (مثال: قانون تجاري)",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="relative mx-auto max-w-xl">
      <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-muted)" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-(--color-silver) bg-white py-3.5 pr-12 pl-11 text-sm text-(--color-navy) outline-none transition focus:border-(--color-gold)"
      />
      {draft && (
        <button
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          aria-label="مسح البحث"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-muted) hover:text-(--color-navy)"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
