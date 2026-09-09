import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Button } from "../../admin/components/ui";
import type { CheckpointForViewer } from "../types/api";

const PROGRESS_REPORT_INTERVAL_MS = 10_000;

interface CheckpointAnswerResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  correctBoolean: boolean | null;
}

export function VideoPlayer({
  manifestUrl,
  onProgress,
  checkpoints = [],
  onAnswerCheckpoint,
}: {
  manifestUrl: string;
  onProgress: (positionSeconds: number) => void;
  /** أسئلة داخل الفيديو (اختياري) — لو موجودة، الفيديو بيوقف تلقائي عند
   *  توقيتها ولازم الطالب يجاوب (صح أو غلط، مفيش فرق) عشان يكمل. */
  checkpoints?: CheckpointForViewer[];
  onAnswerCheckpoint?: (
    checkpointId: string,
    answer: { selectedOptionId?: string; booleanAnswer?: boolean },
  ) => Promise<CheckpointAnswerResult>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const [activeCheckpoint, setActiveCheckpoint] = useState<CheckpointForViewer | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [booleanAnswer, setBooleanAnswer] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckpointAnswerResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // بنتابع السؤال الحالي/اللي اتجاوب عليهم بـ refs (مش state) عشان
  // event listeners بتاعة الفيديو تقدر توصلهم من غير ما تتسجل من جديد كل
  // ما الحالة تتغيّر (وإلا هنفقد آخر currentTime أول ما نعرض overlay).
  const activeCheckpointRef = useRef<CheckpointForViewer | null>(null);
  activeCheckpointRef.current = activeCheckpoint;
  const answeredIdsRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef(0);
  // بنحتفظ بـ onAnswerCheckpoint في ref (زي onProgressRef فوق) عشان مينفعش
  // يبقى ضمن dependencies بتاعة useEffect تحت — لو حطيناه هناك، كل مرة
  // الأب (CourseViewPage) بيعيد render (بيحصل كل ~10 ثواني بسبب تقرير
  // التقدم) بيتبعت callback بـ reference جديدة، فالـ effect كان بيتهد
  // ويتبني تاني ويصفّر answeredIdsRef/lastTimeRef — ده اللي كان بيخلي
  // السؤال يظهر تاني كل شوية حتى بعد ما الطالب يجاوب عليه.
  const onAnswerCheckpointRef = useRef(onAnswerCheckpoint);
  onAnswerCheckpointRef.current = onAnswerCheckpoint;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // سفاري بيدعم HLS بشكل أصلي من غير حاجة لـ hls.js.
      video.src = manifestUrl;
    }

    const reportInterval = window.setInterval(() => {
      if (!video.paused && video.currentTime > 0) {
        onProgressRef.current(Math.floor(video.currentTime));
      }
    }, PROGRESS_REPORT_INTERVAL_MS);

    function reportOnPauseOrEnd() {
      if (video && video.currentTime > 0) {
        onProgressRef.current(Math.floor(video.currentTime));
      }
    }
    video.addEventListener("pause", reportOnPauseOrEnd);
    video.addEventListener("ended", reportOnPauseOrEnd);

    return () => {
      window.clearInterval(reportInterval);
      video.removeEventListener("pause", reportOnPauseOrEnd);
      video.removeEventListener("ended", reportOnPauseOrEnd);
      hls?.destroy();
    };
  }, [manifestUrl]);

  // بوابة أسئلة الفيديو: بتوقف الفيديو أول ما نوصل لتوقيت سؤال لسه ماتجاوبش
  // عليه، وبترجّع الفيديو لتوقيت السؤال لو الطالب حاول يسحب المؤشر ويعدّيه
  // من غير ما يجاوب.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || checkpoints.length === 0 || !onAnswerCheckpointRef.current) return;

    const sorted = checkpoints.slice().sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    answeredIdsRef.current = new Set();
    lastTimeRef.current = 0;

    function triggerCheckpoint(checkpoint: CheckpointForViewer) {
      if (answeredIdsRef.current.has(checkpoint.id)) return;
      video!.pause();
      setSelectedOptionId("");
      setBooleanAnswer(null);
      setResult(null);
      setSubmitError(null);
      setActiveCheckpoint(checkpoint);
    }

    function handleTimeUpdate() {
      if (activeCheckpointRef.current) return;
      const current = video!.currentTime;
      const due = sorted.find(
        (c) =>
          !answeredIdsRef.current.has(c.id) &&
          c.timestampSeconds > lastTimeRef.current &&
          c.timestampSeconds <= current,
      );
      lastTimeRef.current = current;
      if (due) triggerCheckpoint(due);
    }

    function handleSeeked() {
      if (activeCheckpointRef.current) return;
      const current = video!.currentTime;
      const skipped = sorted.find(
        (c) => !answeredIdsRef.current.has(c.id) && c.timestampSeconds <= current,
      );
      if (skipped) {
        video!.currentTime = skipped.timestampSeconds;
        lastTimeRef.current = skipped.timestampSeconds;
        triggerCheckpoint(skipped);
      } else {
        lastTimeRef.current = current;
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeked", handleSeeked);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeked", handleSeeked);
    };
    // ملاحظة: عمدًا من غير onAnswerCheckpoint هنا (شوف تعليق onAnswerCheckpointRef
    // فوق) — الـ effect ده لازم يفضل ثابت طول عرض نفس الدرس، وميتهدّش غير
    // لما قائمة الأسئلة نفسها تتغيّر (درس جديد).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoints]);

  async function handleSubmitAnswer() {
    if (!activeCheckpoint || !onAnswerCheckpoint) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await onAnswerCheckpoint(activeCheckpoint.id, {
        selectedOptionId: activeCheckpoint.type === "MULTIPLE_CHOICE" ? selectedOptionId : undefined,
        booleanAnswer: activeCheckpoint.type === "TRUE_FALSE" ? booleanAnswer ?? undefined : undefined,
      });
      answeredIdsRef.current.add(activeCheckpoint.id);
      setResult(res);
    } catch {
      setSubmitError("حصلت مشكلة في إرسال الإجابة، حاول تاني");
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinue() {
    setActiveCheckpoint(null);
    setResult(null);
    void videoRef.current?.play();
  }

  const canSubmit = activeCheckpoint
    ? activeCheckpoint.type === "MULTIPLE_CHOICE"
      ? !!selectedOptionId
      : booleanAnswer !== null
    : false;

  return (
    <div className="relative">
      <video ref={videoRef} controls className="aspect-video w-full rounded-xl bg-black" />

      {activeCheckpoint && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-(--color-navy)/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            {!result ? (
              <>
                <p className="mb-1 text-xs font-medium text-(--color-gold-dim)">
                  وقف شوية وجاوب عشان الفيديو يكمل
                </p>
                <p className="mb-4 text-sm font-semibold text-(--color-navy)">
                  {activeCheckpoint.question}
                </p>

                {activeCheckpoint.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    {activeCheckpoint.options?.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-(--color-silver-light) px-3 py-2 text-sm hover:bg-(--color-paper-alt)"
                      >
                        <input
                          type="radio"
                          name="checkpoint-option"
                          checked={selectedOptionId === option.id}
                          onChange={() => setSelectedOptionId(option.id)}
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                )}

                {activeCheckpoint.type === "TRUE_FALSE" && (
                  <div className="flex gap-3">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-(--color-silver-light) px-3 py-2 text-sm hover:bg-(--color-paper-alt)">
                      <input
                        type="radio"
                        name="checkpoint-boolean"
                        checked={booleanAnswer === true}
                        onChange={() => setBooleanAnswer(true)}
                      />
                      صح
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-(--color-silver-light) px-3 py-2 text-sm hover:bg-(--color-paper-alt)">
                      <input
                        type="radio"
                        name="checkpoint-boolean"
                        checked={booleanAnswer === false}
                        onChange={() => setBooleanAnswer(false)}
                      />
                      خطأ
                    </label>
                  </div>
                )}

                {submitError && <p className="mt-3 text-xs text-red-600">{submitError}</p>}

                <div className="mt-4 flex justify-end">
                  <Button disabled={!canSubmit} loading={submitting} onClick={handleSubmitAnswer}>
                    تأكيد الإجابة
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p
                  className={`mb-2 text-sm font-semibold ${
                    result.isCorrect ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {result.isCorrect ? "إجابة صحيحة! 👏" : "إجابة غلط"}
                </p>
                {!result.isCorrect && (
                  <p className="mb-4 text-sm text-(--color-muted)">
                    {activeCheckpoint.type === "TRUE_FALSE"
                      ? `الإجابة الصحيحة: ${result.correctBoolean ? "صح" : "خطأ"}`
                      : `الإجابة الصحيحة: ${
                          activeCheckpoint.options?.find((o) => o.id === result.correctOptionId)
                            ?.text ?? ""
                        }`}
                  </p>
                )}
                <p className="mb-4 text-xs text-(--color-muted)">
                  محصلش أي مشكلة — كمل مشاهدة الفيديو عادي.
                </p>
                <div className="flex justify-end">
                  <Button onClick={handleContinue}>متابعة المشاهدة</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
