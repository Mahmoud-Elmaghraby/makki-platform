import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseOwnershipService, Actor } from '../course/course-ownership.service';
import { LessonService } from '../lesson/lesson.service';
import { CreateCheckpointDto, UpdateCheckpointDto, AnswerCheckpointDto } from './dto/checkpoint.dto';
import { CheckpointQuestionType } from '../generated/prisma/enums';

@Injectable()
export class CheckpointService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: CourseOwnershipService,
    // بيتستخدم لسببين: (1) التأكد من ملكية الدرس للكورس في الأدمن، (2) نفس
    // التحقق من حق الطالب يشوف الدرس ده (اشتراك نشط أو معاينة مجانية) بدل
    // ما نكرر منطق enrollment هنا تاني — راجع assertViewerAccess في
    // lesson.service.ts.
    private readonly lessonService: LessonService,
  ) {}

  // ================= الأدمن/المدرب =================

  async findAllForLessonAdmin(courseId: string, lessonId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.lessonService.ensureLessonInCourse(courseId, lessonId);
    return this.prisma.videoCheckpoint.findMany({
      where: { lessonId },
      orderBy: { timestampSeconds: 'asc' },
    });
  }

  async addCheckpoint(
    courseId: string,
    lessonId: string,
    dto: CreateCheckpointDto,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.lessonService.ensureLessonInCourse(courseId, lessonId);
    return this.prisma.videoCheckpoint.create({
      data: {
        lessonId,
        timestampSeconds: dto.timestampSeconds,
        question: dto.question,
        type: dto.type,
        order: dto.order ?? 0,
        options: dto.options,
        correctOptionId: dto.correctOptionId,
        correctBoolean: dto.correctBoolean,
      },
    });
  }

  async updateCheckpoint(
    courseId: string,
    lessonId: string,
    checkpointId: string,
    dto: UpdateCheckpointDto,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.lessonService.ensureLessonInCourse(courseId, lessonId);
    await this.ensureCheckpointInLesson(lessonId, checkpointId);
    return this.prisma.videoCheckpoint.update({ where: { id: checkpointId }, data: dto });
  }

  async removeCheckpoint(courseId: string, lessonId: string, checkpointId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.lessonService.ensureLessonInCourse(courseId, lessonId);
    await this.ensureCheckpointInLesson(lessonId, checkpointId);
    return this.prisma.videoCheckpoint.delete({ where: { id: checkpointId } });
  }

  // ================= الطالب =================

  /** بترجع الأسئلة من غير correctOptionId/correctBoolean — دول بيتكشفوا بس بعد submitAnswer. */
  async findAllForViewer(lessonId: string, studentId: string | null) {
    await this.lessonService.assertViewerAccess(lessonId, studentId);
    const checkpoints = await this.prisma.videoCheckpoint.findMany({
      where: { lessonId },
      orderBy: { timestampSeconds: 'asc' },
    });
    return checkpoints.map((c) => ({
      id: c.id,
      timestampSeconds: c.timestampSeconds,
      question: c.question,
      type: c.type,
      options: c.options,
    }));
  }

  async submitAnswer(
    studentId: string,
    lessonId: string,
    checkpointId: string,
    dto: AnswerCheckpointDto,
  ) {
    await this.lessonService.assertViewerAccess(lessonId, studentId);
    const checkpoint = await this.ensureCheckpointInLesson(lessonId, checkpointId);
    const isCorrect = this.computeIsCorrect(checkpoint, dto);

    await this.prisma.checkpointResponse.upsert({
      where: { checkpointId_studentId: { checkpointId, studentId } },
      update: {
        selectedOptionId: dto.selectedOptionId,
        booleanAnswer: dto.booleanAnswer,
        isCorrect,
        answeredAt: new Date(),
      },
      create: {
        checkpointId,
        studentId,
        selectedOptionId: dto.selectedOptionId,
        booleanAnswer: dto.booleanAnswer,
        isCorrect,
      },
    });

    // الفيديو بيكمل عادي مهما كانت الإجابة — الهدف تركيز مش رسوب، فبنرجّع
    // الإجابة الصح هنا عشان الفرونت إند يوريها للطالب فورًا (تغذية راجعة).
    return {
      isCorrect,
      correctOptionId: checkpoint.correctOptionId,
      correctBoolean: checkpoint.correctBoolean,
    };
  }

  private computeIsCorrect(
    checkpoint: { type: CheckpointQuestionType; correctOptionId: string | null; correctBoolean: boolean | null },
    dto: AnswerCheckpointDto,
  ): boolean {
    if (checkpoint.type === CheckpointQuestionType.TRUE_FALSE) {
      return checkpoint.correctBoolean != null && dto.booleanAnswer === checkpoint.correctBoolean;
    }
    return checkpoint.correctOptionId != null && dto.selectedOptionId === checkpoint.correctOptionId;
  }

  private async ensureCheckpointInLesson(lessonId: string, checkpointId: string) {
    const checkpoint = await this.prisma.videoCheckpoint.findUnique({ where: { id: checkpointId } });
    if (!checkpoint || checkpoint.lessonId !== lessonId) {
      throw new NotFoundException('السؤال مش موجود');
    }
    return checkpoint;
  }
}
