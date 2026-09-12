import { useRef, useState } from "react";
import { User as UserIcon, UploadCloud, RefreshCw } from "lucide-react";
import { Spinner } from "./ui";
import { useUploadInstructorPhoto } from "../hooks/useInstructors";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

/**
 * رفع/تغيير صورة المدرب الشخصية مباشرة من جهاز الأدمن — بتعدي على الـ API
 * بتاعنا وهو اللي يرفعها لـ B2 من جواه. بتتعرض في نافذة تعديل المستخدم
 * (UserFormModal) لأنها محتاجة instructorId موجود بالفعل — يعني متاحة بس وقت
 * تعديل حساب مدرب موجود، مش وقت إنشاء حساب جديد لسه ماتحفظش.
 */
export function InstructorPhotoUploadControl({
  instructorId,
  photoUrl,
}: {
  instructorId: string;
  photoUrl: string | null;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // بنحتفظ بمعاينة محلية عشان الصورة الجديدة تظهر فورًا هنا حتى لو الفورم
  // اللي فاتح منه (UserFormModal) مبيتحدّثش بالـ prop الجديدة إلا لما يتفتح
  // تاني — نفس مصدر الحقيقة الأصلي (query cache) بيتحدّث برضه في الخلفية.
  const [localPhotoUrl, setLocalPhotoUrl] = useState(photoUrl);

  const uploadPhoto = useUploadInstructorPhoto(instructorId);

  async function handleFileChange(file: File) {
    setBusy(true);
    try {
      const updated = await uploadPhoto.mutateAsync({ file });
      setLocalPhotoUrl(updated.photoUrl);
      toast.success("اتحفظت صورة المدرب");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--color-silver) bg-(--color-navy)">
        {busy ? (
          <Spinner className="h-5 w-5 text-white/70" />
        ) : localPhotoUrl ? (
          <img src={localPhotoUrl} alt="صورة المدرب" className="h-full w-full object-cover" />
        ) : (
          <UserIcon className="h-6 w-6 text-white/40" />
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
        {localPhotoUrl ? <RefreshCw className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
        {busy
          ? "بيترفع..."
          : localPhotoUrl
            ? "تغيير الصورة"
            : "رفع صورة"}
      </button>
    </div>
  );
}
