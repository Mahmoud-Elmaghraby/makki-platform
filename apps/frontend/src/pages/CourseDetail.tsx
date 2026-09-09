import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  GraduationCap,
  Scale,
  CheckCircle2,
  ListChecks,
  Users,
  PlayCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  useCourseView,
  usePlaybackToken,
  useUpdateLessonProgress,
  useAttachmentDownloadUrl,
} from "../student/hooks/useCourseView";
import { useStartCheckout } from "../student/hooks/usePayments";
import { useLessonCheckpoints, useAnswerCheckpoint } from "../student/hooks/useCheckpoints";
import { useStudentAuth } from "../student/auth/StudentAuthContext";
import { CourseCurriculum } from "../student/components/CourseCurriculum";
import { VideoPlayer } from "../student/components/VideoPlayer";
import { Button, Card, ErrorBanner, LoadingState, Spinner } from "../admin/components/ui";
import { extractErrorMessage } from "../student/lib/apiClient";
import type { StudentAttachment, StudentLesson, StudentSectionNode } from "../student/types/api";
import { FACULTY_LABELS, ACADEMIC_YEAR_LABELS } from "../lib/academicTaxonomy";

function flattenLessons(sections: StudentSectionNode[], rootLessons: StudentLesson[]): StudentLesson[] {
  const fromSections = sections.flatMap((s) => [...flattenLessons(s.children, s.lessons)]);
  return [...rootLessons, ...fromSections];
}

function formatPrice(priceEGP: number) {
  return `${priceEGP.toLocaleString("ar-EG")} جنيه`;
}

/** مجموع مدة كل الدروس، بصيغة "س د" — بيتحسب من الدروس المنشورة بس (اللي
 * فعلًا الطالب هيشوفها)، ومتاح حتى لو الزائر لسه مش مشترك. */
function formatTotalDuration(totalSeconds: number) {
  if (!totalSeconds) return null;
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} دقيقة`;
  if (minutes === 0) return `${hours} ساعة`;
  return `${hours} س ${minutes} د`;
}

/**
 * صفحة تفاصيل كورس/دورة عامة — بتتفتح من كتالوج الموقع التعريفي (`/courses`)
 * من غير ما الزائر يكون مسجّل دخول خالص. بتستخدم نفس الـ endpoint بالظبط اللي
 * بتستخدمه بوابة الطالب (`GET /courses/:slug`، محمي بـ OptionalStudentJwtAuthGuard
 * في الباك إند) — فالزائر غير المسجّل بيشوف الوصف والسعر والمنهج، والدروس
 * المعلّمة "معاينة مجانية" بس اللي يقدر يشغّلها فعليًا (باقي الدروس تظهر
 * بعلامة قفل). لو الطالب مسجّل دخول ومشترك بالفعل، بنوجهه لنسخة بوابة الطالب
 * (`/student/courses/:slug`) بدل ما نكرر منطق التشغيل الكامل هنا.
 */
export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: course, isLoading, isError, error } = useCourseView(slug);
  const { isAuthenticated } = useStudentAuth();
  const playbackToken = usePlaybackToken();
  const updateProgress = useUpdateLessonProgress(slug);
  const downloadAttachment = useAttachmentDownloadUrl();
  const startCheckout = useStartCheckout();

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const allLessons = useMemo(
    () => (course ? flattenLessons(course.sections, course.lessons) : []),
    [course],
  );

  const activeLessonId = useMemo(() => {
    if (selectedLessonId) return selectedLessonId;
    const firstFree = allLessons.find((l) => !l.isLocked);
    return firstFree?.id ?? null;
  }, [selectedLessonId, allLessons]);

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? null;

  const totalDurationSeconds = useMemo(
    () => allLessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0),
    [allLessons],
  );

  // أسئلة الفيديو محتاجة تسجيل دخول عشان تتجاوب — زائر غير مسجّل بيشوف
  // المعاينة المجانية عادي من غير بوابة أسئلة.
  const checkpointsQuery = useLessonCheckpoints(isAuthenticated ? activeLessonId : null);
  const answerCheckpoint = useAnswerCheckpoint(activeLessonId);

  const playbackTokenMutate = playbackToken.mutate;
  useEffect(() => {
    if (activeLessonId) playbackTokenMutate(activeLessonId);
  }, [activeLessonId, playbackTokenMutate]);

  function handleBuyNow() {
    if (!course) return;
    startCheckout.mutate(course.id, {
      onSuccess: (session) => {
        window.location.href = session.redirectUrl;
      },
    });
  }

  function handleOpenAttachment(attachment: StudentAttachment) {
    downloadAttachment.mutate(attachment.id, {
      onSuccess: (url) => window.open(url, "_blank", "noopener"),
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <LoadingState label="بيتم تحميل الكورس..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <ErrorBanner message={extractErrorMessage(error)} />
      </div>
    );
  }

  if (!course) return null;

  const redirectState = { from: { pathname: `/courses/${slug}` } };
  const trackLabel = course.track === "STUDENT_COURSE" ? "كورس لطلاب كلية الحقوق" : "دورة تدريبية للمحامين";

  // زرار الاشتراك/الدفع بيتكرر مرتين في الصفحة (فوق تحت السعر، وتحت بعد
  // "عن الكورس") — نفس المنطق بالظبط حسب حالة الزائر/الطالب.
  const enrollCta = course.isEnrolled ? (
    <Link
      to={`/student/courses/${slug}`}
      className="rounded-md bg-(--color-gold) px-8 py-3 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)"
    >
      استكمل الكورس من بوابة الطالب
    </Link>
  ) : isAuthenticated ? (
    <div className="flex flex-col items-end gap-2">
      {startCheckout.isError && (
        <ErrorBanner message={extractErrorMessage(startCheckout.error)} />
      )}
      <Button loading={startCheckout.isPending} onClick={handleBuyNow}>
        ادفع {formatPrice(course.priceEGP)} واشترك دلوقتي
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Link
        to="/student/login"
        state={redirectState}
        className="rounded-md bg-(--color-gold) px-6 py-3 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)"
      >
        سجّل دخول للاشتراك
      </Link>
      <Link
        to="/student/register"
        state={redirectState}
        className="rounded-md border border-(--color-navy) px-6 py-3 text-sm font-bold text-(--color-navy) hover:bg-white"
      >
        إنشاء حساب طالب
      </Link>
    </div>
  );

  // لزائر لسه مش قرر يشترك، سيبنا له باب أسهل من التسجيل مباشرة — يسأل
  // عن الكورس/الدورة من غير ما يحتاج يعمل حساب.
  const inquiryType = course.track === "STUDENT_COURSE" ? "COURSE_INQUIRY" : "TRAINING_INQUIRY";
  const inquiryCta = !course.isEnrolled && (
    <a
      href={`/contact?type=${inquiryType}&subject=${encodeURIComponent(course.title)}`}
      className="text-sm font-medium text-(--color-navy)/70 underline-offset-2 hover:text-(--color-navy) hover:underline"
    >
      {course.track === "STUDENT_COURSE" ? "مش متأكد؟ اسألنا عن الكورس ده" : "مش متأكد؟ اسألنا عن الدورة دي"}
    </a>
  );

  const stats: { icon: typeof PlayCircle; label: string }[] = [
    { icon: PlayCircle, label: `${allLessons.length} درس` },
    ...(formatTotalDuration(totalDurationSeconds)
      ? [{ icon: Clock, label: formatTotalDuration(totalDurationSeconds) as string }]
      : []),
    { icon: BarChart3, label: trackLabel },
  ];

  return (
    <div className="bg-(--color-paper)">
      {/* Hero */}
      <section className="bg-(--color-navy) px-6 pb-20 pt-14 text-center">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-(--color-gold)">
          <span>{trackLabel}</span>
          {course.faculty && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {FACULTY_LABELS[course.faculty]}
              {course.academicYear ? ` · ${ACADEMIC_YEAR_LABELS[course.academicYear]}` : ""}
            </span>
          )}
        </div>
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold text-white md:text-4xl">
          {course.title}
        </h1>
        {course.description && (
          <p className="mx-auto mt-5 max-w-xl leading-8 text-white/70">{course.description}</p>
        )}
        {course.instructor && (
          <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full bg-white/5 px-4 py-2">
            {course.instructor.photoUrl ? (
              <img
                src={course.instructor.photoUrl}
                alt={course.instructor.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <Scale className="h-5 w-5 text-(--color-gold)" />
            )}
            <span className="text-sm font-semibold text-white">{course.instructor.name}</span>
          </div>
        )}
      </section>

      {/* بطاقة السعر/الاشتراك — عائمة فوق حافة الهيرو (زي كورسيرا)، وتحتها
          شريط إحصائيات حقيقية (عدد الدروس، المدة، المستوى) من غير أي رقم
          مُلفّق (زي عدد المشتركين أو تقييم لسه مش موجودين فعليًا). */}
      <div className="px-6">
        <div className="mx-auto -mt-10 max-w-6xl rounded-2xl border border-(--color-silver) bg-white p-6 shadow-lg shadow-black/5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-2xl font-extrabold text-(--color-navy)">
              {formatPrice(course.priceEGP)}
            </div>
            <div className="flex flex-col items-end gap-2">
              {enrollCta}
              {inquiryCta}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-(--color-silver-light) pt-5 text-sm text-(--color-muted)">
            {stats.map(({ icon: Icon, label }, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-(--color-gold-dim)" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* عن الكورس — نص تسويقي + هيتعلم إيه + المتطلبات + لمين الكورس ده */}
      {(course.detailedDescription ||
        course.whatYouWillLearn.length > 0 ||
        course.requirements.length > 0 ||
        course.targetAudience) && (
        <section className="px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-display text-2xl font-bold text-(--color-navy)">
              عن الكورس
            </h2>

            {course.detailedDescription && (
              <div className="space-y-4 text-(--color-muted)">
                {course.detailedDescription.split("\n").filter(Boolean).map((paragraph, i) => (
                  <p key={i} className="leading-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {course.whatYouWillLearn.length > 0 && (
              <div className="mt-8 rounded-xl border border-(--color-silver) bg-(--color-paper-alt) p-6">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-(--color-navy)">
                  <ListChecks className="h-5 w-5 text-(--color-gold-dim)" />
                  هتتعلم إيه؟
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.whatYouWillLearn.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-(--color-navy)">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.requirements.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 font-bold text-(--color-navy)">المتطلبات</h3>
                <ul className="space-y-2">
                  {course.requirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-(--color-muted)">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-gold-dim)" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.targetAudience && (
              <div className="mt-8 flex items-start gap-2 rounded-lg bg-(--color-paper-alt) p-4">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-(--color-gold-dim)" />
                <div>
                  <div className="text-sm font-bold text-(--color-navy)">لمين الكورس ده؟</div>
                  <p className="mt-1 text-sm text-(--color-muted)">{course.targetAudience}</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col items-end gap-2">
              {enrollCta}
              {inquiryCta}
            </div>
          </div>
        </section>
      )}

      {/* المحتوى: معاينة الفيديو (لو متاحة) + المنهج */}
      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {activeLesson ? (
              <div className="space-y-4">
                <div className="mb-1 text-xs font-bold text-(--color-gold-dim)">معاينة مجانية</div>
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
                    onProgress={(positionSeconds) => {
                      if (isAuthenticated) {
                        updateProgress.mutate({ lessonId: activeLesson.id, positionSeconds });
                      }
                    }}
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
            ) : course.coverImageUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-xl bg-(--color-navy)">
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 bg-gradient-to-t from-(--color-navy)/90 via-(--color-navy)/10 to-transparent p-6 text-center">
                  <p className="max-w-xs text-sm text-white/90">
                    اشترك في الكورس عشان توصل لكل الدروس — أو راجع المنهج جنب كده
                    علشان تشوف تفاصيل كل درس.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-(--color-navy) text-center">
                <GraduationCap className="h-10 w-10 text-(--color-gold)/60" />
                <p className="max-w-xs px-6 text-sm text-white/70">
                  اشترك في الكورس عشان توصل لكل الدروس — أو راجع المنهج جنب كده
                  علشان تشوف تفاصيل كل درس.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <h3 className="mb-3 font-bold text-(--color-navy)">منهج الكورس</h3>
            <CourseCurriculum
              sections={course.sections}
              rootLessons={course.lessons}
              rootAttachments={course.attachments}
              rootExams={course.exams}
              activeLessonId={activeLessonId}
              onSelectLesson={(lesson) => setSelectedLessonId(lesson.id)}
              onOpenAttachment={handleOpenAttachment}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
