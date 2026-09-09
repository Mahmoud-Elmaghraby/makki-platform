// أنواع TypeScript مرآة لموديلات الـ Prisma وDTOs بتاعة الـ API — بنعرّفها
// كـ union types (مش enum) عشان tsconfig.app.json شغّال بـ erasableSyntaxOnly.
import type { Faculty, AcademicYear } from "../../lib/academicTaxonomy";
export type { Faculty, AcademicYear };

export type Role = "ADMIN" | "MANAGER" | "INSTRUCTOR";
export type CourseTrack = "STUDENT_COURSE" | "LAWYER_TRAINING";
export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type EnrollmentStatus = "ACTIVE" | "REVOKED";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  instructorId: string | null;
}

export interface Instructor {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  user?: { id: string; email: string; role: Role };
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  detailedDescription: string | null;
  whatYouWillLearn: string[];
  requirements: string[];
  targetAudience: string | null;
  track: CourseTrack;
  faculty: Faculty | null;
  academicYear: AcademicYear | null;
  priceEGP: number;
  isPublished: boolean;
  instructorId: string | null;
  instructor?: Instructor | null;
  createdAt: string;
  updatedAt: string;
}

// شكل الشجرة الراجعة من GET /courses/admin/:id (section.service.ts's
// getTreeForCourse) — مختلف عن Section العادي بتاع GET /courses/:id/sections
// (قائمة مسطّحة، من غير lessons/attachments/exams متداخلين).
export interface SectionTreeNode {
  id: string;
  title: string;
  order: number;
  children: SectionTreeNode[];
  lessons: Lesson[];
  attachments: Attachment[];
  exams: Exam[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  courseId: string;
  parentId: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  courseId: string;
  sectionId: string | null;
  storageKey: string | null;
  videoReady: boolean;
  videoFailed: boolean;
  durationSeconds: number | null;
  isFreePreview: boolean;
  isPublished: boolean;
}

export type CheckpointQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

export interface CheckpointOption {
  id: string;
  text: string;
}

// سؤال داخل الفيديو (checkpoint) — بيوقف الفيديو في ثانية معيّنة، الطالب
// لازم يجاوب (صح أو غلط) والفيديو يكمل عادي في الحالتين. مش زي سؤال
// الامتحان: مفيش points ولا essay، بس فيه توقيت (timestampSeconds).
export interface Checkpoint {
  id: string;
  lessonId: string;
  timestampSeconds: number;
  question: string;
  type: CheckpointQuestionType;
  order: number;
  options: CheckpointOption[] | null;
  correctOptionId: string | null;
  correctBoolean: boolean | null;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  order: number;
  points: number;
  options: QuestionOption[] | null;
  correctOptionId: string | null;
  correctBoolean: boolean | null;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  sectionId: string | null;
  durationMinutes: number | null;
  passingScore: number | null;
  maxAttempts: number | null;
  isPublished: boolean;
  questions?: Question[];
  _count?: { questions: number; attempts: number };
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
  student?: { id: string; name: string; phone: string | null };
  _count?: { answers: number };
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  booleanAnswer: boolean | null;
  essayText: string | null;
  pointsAwarded: number | null;
  teacherFeedback: string | null;
  question?: Question;
}

export interface ExamAttemptDetail extends ExamAttemptSummary {
  answers: Answer[];
}

export interface Attachment {
  id: string;
  title: string;
  storageKey: string;
  fileSizeBytes: number | null;
  courseId: string;
  sectionId: string | null;
  lessonId: string | null;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  createdAt: string;
  student?: { id: string; name: string; phone: string | null; email: string | null };
  course?: { id: string; title: string; track: CourseTrack };
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  serialNumber: string;
  fileStorageKey: string;
  issuedAt: string;
  student?: { id: string; name: string; phone: string | null };
  course?: { id: string; title: string; slug: string; track?: CourseTrack };
}

// شكل GET /courses/admin/:id بالظبط — الكورس + الشجرة الكاملة (أقسام
// متداخلة + الدروس/المرفقات/الامتحانات اللي مش تابعة لأي قسم).
export interface CourseDetail extends Course {
  sections: SectionTreeNode[];
  lessons: Lesson[];
  attachments: Attachment[];
  exams: Exam[];
}

export type PaymentProvider = "PAYMOB" | "KASHIER" | "MANUAL";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  amountEGP: number;
  provider: PaymentProvider;
  providerRef: string | null;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  student?: { id: string; name: string; phone: string | null };
  course?: { id: string; title: string; track?: CourseTrack };
}

export interface PaymentsStats {
  totalRevenueEGP: number;
  totalPaidCount: number;
  last30DaysRevenueEGP: number;
  last30DaysPaidCount: number;
  countsByStatus: Record<PaymentStatus, number>;
}

export type ConsultationType = "LEGAL_CONSULTATION" | "COURSE_INQUIRY" | "TRAINING_INQUIRY";
export type ConsultationStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface ConsultationRequest {
  id: string;
  type: ConsultationType;
  name: string;
  phone: string;
  email: string | null;
  subject: string | null;
  message: string;
  status: ConsultationStatus;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  instructor?: {
    id: string;
    bio: string | null;
    photoUrl: string | null;
    _count: { courses: number };
  } | null;
}
