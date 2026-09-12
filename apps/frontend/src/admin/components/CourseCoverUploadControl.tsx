import { useRef, useState } from "react";
import { ImageIcon, UploadCloud, RefreshCw } from "lucide-react";
import { Spinner } from "./ui";
import {
  useCourseCoverUploadUrl,
  useConfirmCoverUpload,
  uploadCoverImageFile,
} from "../hooks/useCourses";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

type Phase = "idle" | "uploading" | "confirming";

/**
 * رفع/تغيير صورة غلاف الكورس مباشرة من جهاز الأدمن — بترفع على B2 زي
 * فيديو الدرس بالظبط (presigned PUT)، من غير خطوة تحويل. بتتعرض في هيدر
 * صفحة تفاصيل الكورس (CourseDetailPage) لأنها محتاجة courseId موجود
 * بالفعل (زي الفيديو — لازم الكورس/الدرس يتحفظ الأول).
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
  const [phase, setPhase] = useState<Phase>("idle");

  const getUploadUrl = useCourseCoverUploadUrl(courseId);
  const confirmUpload = useConfirmCoverUpload(courseId);

  async function handleFileChange(file: File) {
    setPhase("uploading");
    try {
      const { uploadUrl, uploadFields, storageKey } = await getUploadUrl.mutateAsync();
      await uploadCoverImageFile(uploadUrl, uploadFields, file);
      setPhase("confirming");
      await confirmUpload.mutateAsync(storageKey);
      toast.success("اتحفظت صورة الغلاف");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setPhase("idle");
    }
  }

  const busy = phase !== "idle";

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
          ? phase === "uploading"
            ? "بيترفع..."
            : "بيتأكد..."
          : coverImageUrl
            ? "تغيير الصورة"
            : "رفع صورة الغلاف"}
      </button>
    </div>
  );
}
