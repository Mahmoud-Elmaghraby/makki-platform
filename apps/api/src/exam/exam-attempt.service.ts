import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseOwnershipService, Actor } from '../course/course-ownership.service';
import { CertificateService } from '../certificate/certificate.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../generated/prisma/enums';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import {
  AttemptStatus,
  EnrollmentStatus,
  QuestionType,
} from '../generated/prisma/enums';

@Injectable()
export class ExamAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: CourseOwnershipService,
    private readonly certificateService: CertificateService,
    private readonly notificationService: NotificationService,
  ) {}

  // ============================================================
  // جانب الطالب
  // ============================================================

  /** بيرجع الامتحان بأسئلته للطالب وهو بيؤديه — من غير أي إجابة صحيحة. */
  async getExamForTaking(studentId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam || !exam.isPublished) {
      throw new NotFoundException('الامتحان مش موجود');
    }
    await this.assertActiveEnrollment(studentId, exam.courseId);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      questions: exam.questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        order: q.order,
        points: q.points,
        options: this.stripOptionAnswers(q.options),
      })),
    };
  }

  async startAttempt(studentId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || !exam.isPublished) {
      throw new NotFoundException('الامتحان مش موجود');
    }
    await this.assertActiveEnrollment(studentId, exam.courseId);

    const existing = await this.prisma.examAttempt.findFirst({
      where: { examId, studentId, status: AttemptStatus.IN_PROGRESS },
    });
    if (existing) return existing;

    if (exam.maxAttempts != null) {
      const usedAttempts = await this.prisma.examAttempt.count({
        where: { examId, studentId },
      });
      if (usedAttempts >= exam.maxAttempts) {
        throw new ForbiddenException(
          `وصلت لأقصى عدد محاولات مسموح بيها للامتحان ده (${exam.maxAttempts})`,
        );
      }
    }

    return this.prisma.examAttempt.create({
      data: { examId, studentId, status: AttemptStatus.IN_PROGRESS },
    });
  }

  async submitAnswer(
    studentId: string,
    attemptId: string,
    questionId: string,
    dto: SubmitAnswerDto,
  ) {
    const attempt = await this.getOwnInProgressAttempt(studentId, attemptId);
    const exam = await this.prisma.exam.findUniqueOrThrow({ where: { id: attempt.examId } });
    await this.assertWithinTimeLimit(attempt, exam);

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question || question.examId !== attempt.examId) {
      throw new NotFoundException('السؤال مش موجود في الامتحان ده');
    }

    const data = this.buildAnswerData(question.type, dto);
    return this.prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: data,
      create: { attemptId, questionId, ...data },
    });
  }

  async submitAttempt(studentId: string, attemptId: string) {
    const attempt = await this.getOwnInProgressAttempt(studentId, attemptId);
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: attempt.examId },
      include: { questions: true },
    });
    const answers = await this.prisma.answer.findMany({ where: { attemptId } });
    const answersByQuestion = new Map<string, (typeof answers)[number]>(
      answers.map((a) => [a.questionId, a]),
    );

    let hasUngradedEssay = false;
    for (const question of exam.questions) {
      const answer = answersByQuestion.get(question.id);
      if (question.type === QuestionType.ESSAY) {
        if (!answer || answer.pointsAwarded == null) hasUngradedEssay = true;
        continue;
      }
      // تصحيح آلي فوري للأسئلة الموضوعية (اختيار من متعدد / صح وخطأ).
      const isCorrect =
        question.type === QuestionType.MULTIPLE_CHOICE
          ? answer?.selectedOptionId != null &&
            answer.selectedOptionId === question.correctOptionId
          : answer?.booleanAnswer != null &&
            answer.booleanAnswer === question.correctBoolean;

      const pointsAwarded = isCorrect ? question.points : 0;
      if (answer) {
        await this.prisma.answer.update({
          where: { id: answer.id },
          data: { pointsAwarded },
        });
      } else {
        await this.prisma.answer.create({
          data: { attemptId, questionId: question.id, pointsAwarded },
        });
      }
    }

    const maxScore = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const now = new Date();

    if (hasUngradedEssay) {
      const submitted = await this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.SUBMITTED, submittedAt: now, maxScore },
      });
      const student = await this.prisma.student.findUnique({ where: { id: studentId } });
      await this.notificationService.notifyAdmin({
        type: NotificationType.EXAM_NEEDS_GRADING,
        title: `امتحان محتاج تصحيح: ${exam.title}`,
        body: `الطالب ${student?.name ?? ''} سلّم إجابات فيها أسئلة مقالية محتاجة مراجعة يدوي.`,
        link: `/admin/courses/${exam.courseId}/exams/${exam.id}/attempts/${attemptId}`,
      });
      return submitted;
    }

    const score = await this.sumAwardedPoints(attemptId);
    const graded = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.GRADED,
        submittedAt: now,
        gradedAt: now,
        score,
        maxScore,
      },
    });
    await this.notificationService.notifyStudent({
      studentId,
      type: NotificationType.EXAM_GRADED,
      title: `نتيجة امتحان "${exam.title}" جاهزة`,
      body: `درجتك: ${score} من ${maxScore}.`,
      link: `/student/exam-attempts/${attemptId}`,
    });
    await this.certificateService.tryIssueForCourse(studentId, exam.courseId);
    return graded;
  }

  /**
   * بيرجع محاولة الطالب لمراجعة نتيجتها — مع نص كل سؤال ودرجته عشان الطالب
   * يقدر يراجع إجاباته، بس من غير correctOptionId/correctBoolean (منمنعش
   * تسريب الإجابة الصح، خصوصًا إن الطالب ممكن يحاول تاني بعد التصحيح).
   */
  async getOwnAttempt(studentId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            durationMinutes: true,
            passingScore: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                text: true,
                order: true,
                points: true,
                options: true,
              },
            },
          },
        },
      },
    });
    if (!attempt || attempt.studentId !== studentId) {
      throw new NotFoundException('المحاولة مش موجودة');
    }
    return attempt;
  }

  async listMyAttempts(studentId: string, examId: string) {
    return this.prisma.examAttempt.findMany({
      where: { examId, studentId },
      orderBy: { startedAt: 'desc' },
    });
  }

  // ============================================================
  // جانب الأدمن/المدرب — تصحيح الأسئلة المقالية
  // ============================================================

  async listAttemptsForExamAdmin(courseId: string, examId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    return this.prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getAttemptForGradingAdmin(
    courseId: string,
    examId: string,
    attemptId: string,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        student: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!attempt || attempt.examId !== examId) {
      throw new NotFoundException('المحاولة مش موجودة');
    }
    return attempt;
  }

  async gradeEssayAnswer(
    courseId: string,
    examId: string,
    attemptId: string,
    questionId: string,
    dto: GradeAnswerDto,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);

    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.examId !== examId) {
      throw new NotFoundException('المحاولة مش موجودة');
    }
    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('الطالب لسه ما سلّمش الامتحان ده');
    }

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question || question.examId !== examId || question.type !== QuestionType.ESSAY) {
      throw new NotFoundException('السؤال المقالي ده مش موجود في الامتحان ده');
    }

    await this.prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { pointsAwarded: dto.pointsAwarded, teacherFeedback: dto.teacherFeedback },
      create: {
        attemptId,
        questionId,
        pointsAwarded: dto.pointsAwarded,
        teacherFeedback: dto.teacherFeedback,
      },
    });

    return this.maybeFinalizeGrading(attempt.id, attempt.studentId, examId);
  }

  // ============================================================
  // مساعدين
  // ============================================================

  /**
   * بعد ما المدرب يصحّح سؤال مقالي، بنشوف لو كل الأسئلة المقالية في
   * الامتحان ده خلصت تصحيح — لو أيوه، بنقفل المحاولة (GRADED) ونحسب
   * الدرجة النهائية ونحاول نصدر الشهادة.
   */
  private async maybeFinalizeGrading(attemptId: string, studentId: string, examId: string) {
    const exam = await this.prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { questions: { where: { type: QuestionType.ESSAY } } },
    });
    const answers = await this.prisma.answer.findMany({ where: { attemptId } });
    const answersByQuestion = new Map<string, (typeof answers)[number]>(
      answers.map((a) => [a.questionId, a]),
    );

    const stillUngraded = exam.questions.some((q) => {
      const answer = answersByQuestion.get(q.id);
      return !answer || answer.pointsAwarded == null;
    });

    if (stillUngraded) {
      return this.prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    }

    const score = await this.sumAwardedPoints(attemptId);
    const graded = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.GRADED, gradedAt: new Date(), score },
    });
    await this.notificationService.notifyStudent({
      studentId,
      type: NotificationType.EXAM_GRADED,
      title: `نتيجة امتحان "${exam.title}" جاهزة`,
      body: `درجتك: ${score} من ${graded.maxScore ?? ''}.`,
      link: `/student/exam-attempts/${attemptId}`,
    });
    await this.certificateService.tryIssueForCourse(studentId, exam.courseId);
    return graded;
  }

  private async sumAwardedPoints(attemptId: string): Promise<number> {
    const result = await this.prisma.answer.aggregate({
      where: { attemptId },
      _sum: { pointsAwarded: true },
    });
    return result._sum.pointsAwarded ?? 0;
  }

  private buildAnswerData(type: QuestionType, dto: SubmitAnswerDto) {
    if (type === QuestionType.MULTIPLE_CHOICE) {
      return { selectedOptionId: dto.selectedOptionId, booleanAnswer: null, essayText: null };
    }
    if (type === QuestionType.TRUE_FALSE) {
      return { selectedOptionId: null, booleanAnswer: dto.booleanAnswer, essayText: null };
    }
    return { selectedOptionId: null, booleanAnswer: null, essayText: dto.essayText };
  }

  private stripOptionAnswers(options: unknown) {
    if (!Array.isArray(options)) return options;
    return options.map((option: { id: string; text: string }) => ({
      id: option.id,
      text: option.text,
    }));
  }

  /**
   * بيرفض إضافة/تعديل إجابة بعد ما وقت الامتحان يخلص — الفرونت إند بيعمل
   * تسليم تلقائي وقت الصفر، بس ده تأكيد من السيرفر عشان محدش يقدر يكمل
   * يجاوب عن طريق نداء الـ API مباشرة بعد ما العداد يخلص.
   */
  private async assertWithinTimeLimit(
    attempt: { startedAt: Date },
    exam: { durationMinutes: number | null },
  ) {
    if (exam.durationMinutes == null) return;
    const deadline = attempt.startedAt.getTime() + exam.durationMinutes * 60_000;
    if (Date.now() > deadline) {
      throw new BadRequestException('انتهى الوقت المحدد للامتحان، سلّم إجاباتك دلوقتي');
    }
  }

  private async assertActiveEnrollment(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (enrollment?.status !== EnrollmentStatus.ACTIVE) {
      throw new ForbiddenException('لازم تكون مشترك في الكورس ده');
    }
  }

  private async getOwnInProgressAttempt(studentId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.studentId !== studentId) {
      throw new NotFoundException('المحاولة مش موجودة');
    }
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('المحاولة دي مسلّمة بالفعل');
    }
    return attempt;
  }

  private async ensureExamInCourse(courseId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.courseId !== courseId) {
      throw new NotFoundException('الامتحان مش موجود');
    }
    return exam;
  }
}
