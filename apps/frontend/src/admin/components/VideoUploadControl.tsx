import { useEffect, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button, Spinner } from "./ui";
import { useUploadLessonVideo, useLessonStatus } from "../hooks/useLessons";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";

type Phase = "idle" | "uploading" | "processing" | "done" | "failed";

/**
 * تحكم رفع/إعادة رفع فيديو الدرس. الملف بيتبعت مباشرة على الـ API بتاعنا
 * (مفيش presigned URL ولا تأكيد منفصل)، وبمجرد ما الرفع يخلص السيرفر
 * بيجدول التحويل (transcode) تلقائيًا.
 */
export function VideoUploadControl({
  courseId,
  lessonId,
  videoReady,
  videoFailed,
  onDone,
}: {
  courseId: string;
  lessonId: string;
  videoReady?: boolean;
  videoFailed?: boolean;
  onDone?: () => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(videoReady ? "done" : videoFailed ? "failed" : "idle");
  const [progress, setProgress] = useState(0);

  const uploadVideo = useUploadLessonVideo(courseId);
  const statusQuery = useLessonStatus(courseId, lessonId, phase === "processing");

  useEffect(() => {
    if (phase !== "processing" || !statusQuery.data) return;
    if (statusQuery.data.ready) {
      setPhase("done");
      onDone?.();
    } else if (statusQuery.data.failed) {
      setPhase("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.data, phase]);

  async function handleFileChange(file: File) {
    setPhase("uploading");
    setProgress(0);
    try {
      await uploadVideo.mutateAsync({ lessonId, file, onProgress: setProgress });
      setPhase("processing");
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setPhase("failed");
    }
  }

  if (phase === "done") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        الفيديو جاهز
      </span>
    );
  }

  if (phase === "uploading" || phase === "processing") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-(--color-royal-light)">
        <Spinner className="h-3.5 w-3.5" />
        {phase === "uploading" && `بيترفع... ${progress}%`}
        {phase === "processing" && "بيتحوّل لصيغة العرض..."}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {phase === "failed" && (
        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
          <XCircle className="h-3.5 w-3.5" />
          فشل الرفع/التحويل
        </span>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileChange(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        {phase === "failed" ? <RefreshCw className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
        {phase === "failed" ? "إعادة المحاولة" : "رفع فيديو"}
      </Button>
    </div>
  );
}
