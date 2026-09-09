import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ExamService } from './exam.service';
import { ExamAttemptService } from './exam-attempt.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

type ActorRequest = Request & { user: { role: Role; instructorId: string | null } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
@Controller('courses/:courseId/exams')
export class ExamAdminController {
  constructor(
    private readonly examService: ExamService,
    private readonly examAttemptService: ExamAttemptService,
  ) {}

  @Get()
  findAll(@Param('courseId') courseId: string, @Req() req: ActorRequest) {
    return this.examService.findAllForCourseAdmin(courseId, req.user);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateExamDto,
    @Req() req: ActorRequest,
  ) {
    return this.examService.createForCourse(courseId, dto, req.user);
  }

  @Get(':examId')
  findOne(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Req() req: ActorRequest,
  ) {
    return this.examService.findOneAdmin(courseId, examId, req.user);
  }

  @Patch(':examId')
  update(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Body() dto: UpdateExamDto,
    @Req() req: ActorRequest,
  ) {
    return this.examService.update(courseId, examId, dto, req.user);
  }

  @Delete(':examId')
  remove(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Req() req: ActorRequest,
  ) {
    return this.examService.remove(courseId, examId, req.user);
  }

  @Post(':examId/questions')
  addQuestion(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Body() dto: CreateQuestionDto,
    @Req() req: ActorRequest,
  ) {
    return this.examService.addQuestion(courseId, examId, dto, req.user);
  }

  @Patch(':examId/questions/:questionId')
  updateQuestion(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
    @Req() req: ActorRequest,
  ) {
    return this.examService.updateQuestion(courseId, examId, questionId, dto, req.user);
  }

  @Delete(':examId/questions/:questionId')
  removeQuestion(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Req() req: ActorRequest,
  ) {
    return this.examService.removeQuestion(courseId, examId, questionId, req.user);
  }

  // ---- تصحيح محاولات الطلاب (خاصة الأسئلة المقالية) ----

  @Get(':examId/attempts')
  listAttempts(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Req() req: ActorRequest,
  ) {
    return this.examAttemptService.listAttemptsForExamAdmin(courseId, examId, req.user);
  }

  @Get(':examId/attempts/:attemptId')
  getAttempt(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Param('attemptId') attemptId: string,
    @Req() req: ActorRequest,
  ) {
    return this.examAttemptService.getAttemptForGradingAdmin(
      courseId,
      examId,
      attemptId,
      req.user,
    );
  }

  @Patch(':examId/attempts/:attemptId/answers/:questionId/grade')
  gradeAnswer(
    @Param('courseId') courseId: string,
    @Param('examId') examId: string,
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: GradeAnswerDto,
    @Req() req: ActorRequest,
  ) {
    return this.examAttemptService.gradeEssayAnswer(
      courseId,
      examId,
      attemptId,
      questionId,
      dto,
      req.user,
    );
  }
}
