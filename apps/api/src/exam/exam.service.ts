import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseOwnershipService, Actor } from '../course/course-ownership.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';

@Injectable()
export class ExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: CourseOwnershipService,
  ) {}

  async createForCourse(courseId: string, dto: CreateExamDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    if (dto.sectionId) await this.ensureSectionInCourse(courseId, dto.sectionId);
    return this.prisma.exam.create({ data: { courseId, ...dto } });
  }

  async findAllForCourseAdmin(courseId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    return this.prisma.exam.findMany({
      where: { courseId },
      include: { _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneAdmin(courseId: string, examId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam || exam.courseId !== courseId) {
      throw new NotFoundException('الامتحان مش موجود');
    }
    return exam;
  }

  async update(courseId: string, examId: string, dto: UpdateExamDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    if (dto.sectionId) await this.ensureSectionInCourse(courseId, dto.sectionId);
    return this.prisma.exam.update({ where: { id: examId }, data: dto });
  }

  async remove(courseId: string, examId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    return this.prisma.exam.delete({ where: { id: examId } });
  }

  async addQuestion(
    courseId: string,
    examId: string,
    dto: CreateQuestionDto,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    return this.prisma.question.create({
      data: {
        examId,
        type: dto.type,
        text: dto.text,
        order: dto.order ?? 0,
        points: dto.points ?? 1,
        options: dto.options,
        correctOptionId: dto.correctOptionId,
        correctBoolean: dto.correctBoolean,
      },
    });
  }

  async updateQuestion(
    courseId: string,
    examId: string,
    questionId: string,
    dto: UpdateQuestionDto,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    await this.ensureQuestionInExam(examId, questionId);
    return this.prisma.question.update({ where: { id: questionId }, data: dto });
  }

  async removeQuestion(
    courseId: string,
    examId: string,
    questionId: string,
    actor: Actor,
  ) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureExamInCourse(courseId, examId);
    await this.ensureQuestionInExam(examId, questionId);
    return this.prisma.question.delete({ where: { id: questionId } });
  }

  async ensureExamInCourse(courseId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.courseId !== courseId) {
      throw new NotFoundException('الامتحان مش موجود');
    }
    return exam;
  }

  private async ensureQuestionInExam(examId: string, questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question || question.examId !== examId) {
      throw new NotFoundException('السؤال مش موجود');
    }
    return question;
  }

  private async ensureSectionInCourse(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.courseId !== courseId) {
      throw new NotFoundException('القسم مش موجود');
    }
  }
}
