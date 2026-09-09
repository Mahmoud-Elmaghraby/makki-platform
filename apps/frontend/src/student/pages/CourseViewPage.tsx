import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useCourseView, usePlaybackToken, useUpdateLessonProgress, useAttachmentDownloadUrl } from "../hooks/useCourseView";
import { useStartCheckout } from "../hooks/usePayments";
import { useLessonCheckpoints, useAnswerCheckpoint } from "../hooks/useCheckpoints";
import { useStudentAuth } from "../auth/StudentAuthContext";
import { CourseCurriculum } from "../components/CourseCurriculum";
import { VideoPlayer } from "../components/VideoPlayer";
import { Button, Card, EmptyState, ErrorBanner, LoadingState, PageHeader, Spinner } from "../../admin/components/ui";
import { extractErrorMessage } from "../lib/apiClient";
import type { StudentAttachment, StudentLesson, StudentSectionNode } from "../types/api";

function flattenLessons(sections: StudentSectionNode[], rootLessons: StudentLesson[]): StudentLesson[] {
  const fromSections = sections.flatMap((s) => [...flattenLessons(s.children, s.lessons)]);
  return [...rootLessons, ...fromSections];
}

export function CourseViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: course, isLoading, isError, error } = useCourseView(slug);
  const playbackToken = usePlaybackToken();
  const updateProgress = useUpdateLessonProgress(slug);
  const downloadAttachment = useAttachmentDownloadUrl();
  const startCheckout = useStartCheckout();
  const { isAuthenticated } = useStudentAuth();

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  function handleBuyNow() {
    if (!course) return;
    startCheckout.mutate(course.id, {
      onSuccess: (session) => {
        window.location.href = session.redirectUrl;
      },
    });
  }

  const allLessons = useMemo(
    () => (course ? flattenLessons(course.sections, course.lessons) : []),
    [course],
  );

  const activeLessonId = useMemo(() => {
    if (selectedLessonId) return selectedLessonId;
    const firstPlayable = allLessons.find((l) => !l.isLocked);
    return firstPlayable?.id ?? null;
  }, [selectedLessonId, allLessons]);

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? null;

  // أسئلة الفيديو محتاجة تسجيل دخول عشان تتجاوب (submitAnswer محمي بـ
  // StudentJwtAuthGuard) — فبنجيبها بس للطالب المسجّل دخول، وزائر المعاينة
  // المجانية يشوف الفيديو عادي من غير بوابة أسئلة.
  const checkpointsQuery = useLessonCheckpoints(isAuthenticated ? activeLessonId : null);
  const answerCheckpoint = useAnswerCheckpoint(activeLessonId);

  function handleSelectLesson(lesson: StudentLesson) {
    setSelectedLessonId(lesson.id);
  }

  function handleOpenAttachment(attachment: StudentAttachment) {
    downloadAttachment.mutate(attachment.id, {
      onSuccess: (url) => window.open(url, "_blank", "noopener"),
    });
  }

  const playbackTokenMutate = playbackToken.mutate;
  // أول ما درس يتحدد (سواء تلقائيًا أول ما الكورس يتحمّل، أو باختيار الطالب)
  // بنجيب رابط تشغيله من الـ API.
  useEffect(() => {
    if (activeLessonId) playbackTokenMutate(activeLessonId);
  }, [activeLessonId, playbackTokenMutate]);

  if (isLoading) return <LoadingState label="بيتم تحميل الكورس..." />;
  if (isError) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!course) return null;

  if (!course.isEnrolled && !allLessons.some((l) => l.isFreePreview)) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <EmptyState
          title="مش مشترك في الكورس ده"
          description={`اشترك دلوقتي بـ ${course.priceEGP} جنيه وابدأ فورًا.`}
        />
        {startCheckout.isError && (
          <div className="w-full max-w-sm">
            <ErrorBanner message={extractErrorMessage(startCheckout.error)} />
          </div>
        )}
        <Button loading={startCheckout.isPending} onClick={handleBuyNow}>
          ادفع {course.priceEGP} جنيه واشترك دلوقتي
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={course.title} description={course.instructor?.name ?? undefined} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeLesson ? (
            <div className="space-y-4">
              {playbackToken.isPending && (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-(--color-navy)">
                  <Spinner className="text-white/70" />
                </div>
              )}
              {playbackToken.isError && (
                <ErrorBanner message={extractErrorMessage(playbackToken.error)} />
              )}
              {playbackToken.data && !playbackToken.isPending && (
                <VideoPlayer
                  key={activeLesson.id}
                  manifestUrl={playbackToken.data.manifestUrl}
                  onProgress={(positionSeconds) =>
                    updateProgress.mutate({ lessonId: activeLesson.id, positionSeconds })
                  }
                  checkpoints={checkpointsQuery.data ?? []}
                  onAnswerCheckpoint={
                    isAuthenticated
                      ? (checkpointId, answer) =>
                          answerCheckpoint.mutateAsync({ checkpointId, ...answer })
                      : undefined
                  }
                />
              )}

              <Card className="p-4">
                <h2 className="font-display text-lg font-semibold text-(--color-navy)">
                  {activeLesson.title}
                </h2>
                {activeLesson.description && (
                  <p className="mt-2 text-sm text-(--color-muted)">{activeLesson.description}</p>
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              title="مفيش دروس متاحة دلوقتي"
              description="لسه المدرب مضفش دروس منشورة للكورس ده."
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <CourseCurriculum
            sections={course.sections}
            rootLessons={course.lessons}
            rootAttachments={course.attachments}
            rootExams={course.exams}
            activeLessonId={activeLessonId}
            onSelectLesson={handleSelectLesson}
            onOpenAttachment={handleOpenAttachment}
          />
        </div>
      </div>
    </div>
  );
}
