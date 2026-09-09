// أنواع TypeScript بتاعة بوابة الطالب — مرآة لشكل الرد من الـ API (شوف
// course.controller.ts / enrollment.controller.ts / exam-attempt.controller.ts
// / certificate.controller.ts / lesson.controller.ts في الباك إند).

import type { CourseTrack, QuestionType, AttemptStatus, Faculty, AcademicYear } from "../../admin/types/api";

export type { CourseTrack, QuestionType, AttemptStatus, Faculty, AcademicYear };

export interface StudentProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

// ============================================================
// "كورساتي" — GET /enrollments/me
// ============================================================

export interface MyEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  course: {
    id: string;
    title: string;
    slug: string;
    track: CourseTrack;
    coverImageUrl: string | null;
  };
}

// ============================================================
// صفحة الكورس — GET /courses/:slug
// ============================================================

export interface StudentAttachment {
  id: string;
  title: string;
  fileSizeBytes: number | null;
}

export interface StudentExamSummary {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
}

export interface StudentLesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationSeconds: number | null;
  isFreePreview: boolean;
  isLocked: boolean;
  completed: boolean;
  watchedSeconds: number;
}

export interface StudentSectionNode {
  id: string;
  title: string;
  order: number;
  children: StudentSectionNode[];
  lessons: StudentLesson[];
  attachments: StudentAttachment[];
  exams: StudentExamSummary[];
}

export interface StudentCourseView {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  detailedDescription: string | null;
  whatYouWillLearn: string[];
  requirements: string[];
  targetAudience: string | null;
  coverImageUrl: string | null;
  track: CourseTrack;
  faculty: Faculty | null;
  academicYear: AcademicYear | null;
  priceEGP: number;
  instructor: { id: string; name: string; bio: string | null; photoUrl: string | null } | null;
  isEnrolled: boolean;
  sections: StudentSectionNode[];
  lessons: StudentLesson[];
  attachments: StudentAttachment[];
  exams: StudentExamSummary[];
}

// ============================================================
// تشغيل الفيديو
// ============================================================

export interface PlaybackToken {
  manifestUrl: string;
  expiresAt: string;
}

// ============================================================
// الامتحانات
// ============================================================

export interface ExamQuestionOption {
  id: string;
  text: string;
}

export interface ExamQuestionForTaking {
  id: string;
  type: QuestionType;
  text: string;
  order: number;
  points: number;
  options: ExamQuestionOption[] | null;
}

export interface ExamForTaking {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  questions: ExamQuestionForTaking[];
}

export interface ExamAttemptSummary {
  id: string;
  examId: string;
  studentId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  score: number | null;
  maxScore: number | null;
}

export interface ExamAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  booleanAnswer: boolean | null;
  essayText: string | null;
  pointsAwarded: number | null;
  teacherFeedback: string | null;
  question: {
    id: string;
    type: QuestionType;
    text: string;
    order: number;
    points: number;
    options: ExamQuestionOption[] | null;
  };
}

export interface ExamAttemptDetail extends ExamAttemptSummary {
  answers: ExamAttemptAnswer[];
  exam: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number | null;
    passingScore: number | null;
  };
}

// ============================================================
// أسئلة الفيديو (checkpoints) — GET /lessons/:lessonId/checkpoints ،
// POST /lessons/:lessonId/checkpoints/:checkpointId/answer
// ============================================================

export type CheckpointQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

export interface CheckpointOptionForViewer {
  id: string;
  text: string;
}

// شكل السؤال زي ما الطالب بيشوفه — من غير correctOptionId/correctBoolean،
// دول بيرجعوا بس في رد submitAnswer بعد ما يجاوب (تغذية راجعة فورية).
export interface CheckpointForViewer {
  id: string;
  timestampSeconds: number;
  question: string;
  type: CheckpointQuestionType;
  options: CheckpointOptionForViewer[] | null;
}

export interface CheckpointAnswerResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  correctBoolean: boolean | null;
}

// ============================================================
// الدفع — POST /payments/checkout ، GET /payments/:paymentId
// ============================================================

export interface CheckoutSession {
  paymentId: string;
  redirectUrl: string;
}

export type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface PaymentStatus {
  status: PaymentStatusValue;
  courseId: string;
}

// ============================================================
// الشهادات — GET /certificates/me
// ============================================================

export interface StudentCertificate {
  id: string;
  studentId: string;
  courseId: string;
  serialNumber: string;
  fileStorageKey: string;
  issuedAt: string;
  course: { id: string; title: string; slug: string };
}
