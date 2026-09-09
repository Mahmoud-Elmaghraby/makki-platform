import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { Clock } from "lucide-react";
import {
  useAttemptDetail,
  useExamForTaking,
  useStartAttempt,
  useSubmitAnswer,
  useSubmitAttempt,
} from "../hooks/useExamAttempt";
import { Button, Card, ErrorBanner, LoadingState, PageHeader, Textarea } from "../../admin/components/ui";
import { useToast } from "../../admin/components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { ExamQuestionForTaking } from "../types/api";

interface LocalAnswer {
  selectedOptionId?: string;
  booleanAnswer?: boolean;
  essayText?: string;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function QuestionCard({
  question,
  index,
  answer,
  onChange,
}: {
  question: ExamQuestionForTaking;
  index: number;
  answer: LocalAnswer;
  onChange: (answer: LocalAnswer) => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-medium text-(--color-navy)">
          {index + 1}. {question.text}
        </p>
        <span className="shrink-0 text-xs text-(--color-muted)">{question.points} درجة</span>
      </div>

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={clsx(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition",
                answer.selectedOptionId === option.id
                  ? "border-(--color-royal-light) bg-(--color-royal-light)/5"
                  : "border-(--color-silver) hover:bg-(--color-paper-alt)",
              )}
            >
              <input
                type="radio"
                name={question.id}
                checked={answer.selectedOptionId === option.id}
                onChange={() => onChange({ selectedOptionId: option.id })}
                className="h-4 w-4"
              />
              {option.text}
            </label>
          ))}
        </div>
      )}

      {question.type === "TRUE_FALSE" && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={answer.booleanAnswer === true ? "primary" : "secondary"}
            onClick={() => onChange({ booleanAnswer: true })}
          >
            صح
          </Button>
          <Button
            type="button"
            variant={answer.booleanAnswer === false ? "primary" : "secondary"}
            onClick={() => onChange({ booleanAnswer: false })}
          >
            غلط
          </Button>
        </div>
      )}

      {question.type === "ESSAY" && (
        <Textarea
          rows={4}
          defaultValue={answer.essayText ?? ""}
          onBlur={(e) => onChange({ essayText: e.target.value })}
          placeholder="اكتب إجابتك هنا..."
        />
      )}
    </Card>
  );
}

export function ExamTakePage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const toast = useToast();
  const examQuery = useExamForTaking(examId);
  const startAttempt = useStartAttempt();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const attemptQuery = useAttemptDetail(attemptId ?? undefined);
  const submitAnswer = useSubmitAnswer();
  const submitAttempt = useSubmitAttempt();

  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const hasPrefilled = useRef(false);
  const hasAutoSubmitted = useRef(false);

  // بدء (أو استكمال) المحاولة أول ما نعرف رقم الامتحان.
  useEffect(() => {
    if (!examId) return;
    startAttempt.mutate(examId, {
      onSuccess: (attempt) => setAttemptId(attempt.id),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // تعبئة الإجابات المحفوظة مسبقًا (لو الطالب طلّع من الامتحان ورجع تاني).
  useEffect(() => {
    if (attemptQuery.data && !hasPrefilled.current) {
      hasPrefilled.current = true;
      const initial: Record<string, LocalAnswer> = {};
      for (const a of attemptQuery.data.answers) {
        initial[a.questionId] = {
          selectedOptionId: a.selectedOptionId ?? undefined,
          booleanAnswer: a.booleanAnswer ?? undefined,
          essayText: a.essayText ?? undefined,
        };
      }
      setAnswers(initial);
    }
  }, [attemptQuery.data]);

  const deadline = useMemo(() => {
    if (!attemptQuery.data?.exam.durationMinutes || !attemptQuery.data.startedAt) return null;
    return new Date(attemptQuery.data.startedAt).getTime() + attemptQuery.data.exam.durationMinutes * 60_000;
  }, [attemptQuery.data]);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemainingSeconds(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  function handleSubmit() {
    if (!attemptId) return;
    submitAttempt.mutate(attemptId, {
      onSuccess: () => navigate(`/student/exam-attempts/${attemptId}`, { replace: true }),
    });
  }

  useEffect(() => {
    if (remainingSeconds === 0 && attemptId && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, attemptId]);

  function handleAnswerChange(question: ExamQuestionForTaking, value: LocalAnswer) {
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], ...value } }));
    if (!attemptId) return;
    submitAnswer.mutate(
      {
        attemptId,
        questionId: question.id,
        type: question.type,
        selectedOptionId: value.selectedOptionId,
        booleanAnswer: value.booleanAnswer,
        essayText: value.essayText,
      },
      {
        // لو السيرفر رفض الإجابة لأن وقت الامتحان خلص (مثلاً الجهاز كان
        // نايم وفوّت التسليم التلقائي)، نسلّم الامتحان فورًا بدل ما نسيب
        // الطالب يفضل يجاوب من غير فايدة.
        onError: (err) => {
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            toast.error(extractErrorMessage(err));
            handleSubmit();
          }
        },
      },
    );
  }

  if (examQuery.isLoading || startAttempt.isPending || attemptQuery.isLoading) {
    return <LoadingState label="بيتم تجهيز الامتحان..." />;
  }
  if (examQuery.isError) return <ErrorBanner message={extractErrorMessage(examQuery.error)} />;
  if (startAttempt.isError) return <ErrorBanner message={extractErrorMessage(startAttempt.error)} />;
  if (!examQuery.data) return null;

  const exam = examQuery.data;

  return (
    <div>
      <PageHeader
        title={exam.title}
        description={exam.description ?? undefined}
        actions={
          remainingSeconds != null && (
            <div className="flex items-center gap-2 rounded-lg bg-(--color-navy) px-3 py-1.5 text-sm font-semibold text-(--color-gold)">
              <Clock className="h-4 w-4" />
              {formatClock(remainingSeconds)}
            </div>
          )
        }
      />

      <div className="space-y-4">
        {exam.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id] ?? {}}
            onChange={(value) => handleAnswerChange(question, value)}
          />
        ))}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} loading={submitAttempt.isPending} size="md">
            تسليم الامتحان
          </Button>
        </div>
      </div>
    </div>
  );
}
