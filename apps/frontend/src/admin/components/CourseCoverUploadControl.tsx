import { useRef, useState } from "react";
import { ImageIcon, UploadCloud, RefreshCw } from "lucide-react";
import { Spinner } from "./ui";
import { useUploadCourseCover } from "../hooks/useCourses";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

/**
 * رفع/تغيير صورة غلاف الكورس مباشرة من جهاز الأدمن — بتعدي على الـ API
 * بتاعنا وهو اللي يرفعها لـ B2 من جواه. بتتعرض في هيدر صفحة تفاصيل الكورس
 * (CourseDetailPage) لأنها محتاجة courseId موجود بالفعل.
 */
export function CourseCoverUploadControl({
  courseId,
  coverImageUrl,
}: {
  courseId: string;
  coverImageUrl: string | null;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const uploadCover = useUploadCourseCover(courseId);

  async function handleFileChange(file: File) {
    setBusy(true);
    try {
      await uploadCover.mutateAsync({ file });
      toast.success("اتحفظت صورة الغلاف");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-(--color-silver) bg-(--color-navy)">
        {busy ? (
          <Spinner className="h-5 w-5 text-white/70" />
        ) : coverImageUrl ? (
          <img src={coverImageUrl} alt="غلاف الكورس" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-white/40" />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileChange(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 rounded-md border border-(--color-silver) px-3 py-1.5 text-xs font-bold text-(--color-navy) hover:bg-(--color-paper-alt) disabled:opacity-60"
      >
        {coverImageUrl ? <RefreshCw className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
        {busy
          ? "بيترفع..."
          : coverImageUrl
            ? "تغيير الصورة"
            : "رفع صورة الغلاف"}
      </button>
    </div>
  );
}
