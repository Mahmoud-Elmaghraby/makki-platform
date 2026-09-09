import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ExamAttemptService } from './exam-attempt.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';

type StudentRequest = Request & { user: { id: string } };

// راوتات الطالب وهو بيؤدي الامتحان: بدء محاولة، إجابة سؤال، تسليم، ومراجعة
// النتيجة بعدين.
@UseGuards(StudentJwtAuthGuard)
@Controller()
export class ExamAttemptController {
  constructor(private readonly examAttemptService: ExamAttemptService) {}

  @Get('exams/:examId/take')
  getExamForTaking(@Param('examId') examId: string, @Req() req: StudentRequest) {
    return this.examAttemptService.getExamForTaking(req.user.id, examId);
  }

  @Post('exams/:examId/attempts')
  startAttempt(@Param('examId') examId: string, @Req() req: StudentRequest) {
    return this.examAttemptService.startAttempt(req.user.id, examId);
  }

  @Get('exams/:examId/attempts/me')
  listMyAttempts(@Param('examId') examId: string, @Req() req: StudentRequest) {
    return this.examAttemptService.listMyAttempts(req.user.id, examId);
  }

  @Get('exam-attempts/:attemptId')
  getAttempt(@Param('attemptId') attemptId: string, @Req() req: StudentRequest) {
    return this.examAttemptService.getOwnAttempt(req.user.id, attemptId);
  }

  @Patch('exam-attempts/:attemptId/answers/:questionId')
  submitAnswer(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SubmitAnswerDto,
    @Req() req: StudentRequest,
  ) {
    return this.examAttemptService.submitAnswer(req.user.id, attemptId, questionId, dto);
  }

  @Post('exam-attempts/:attemptId/submit')
  submitAttempt(@Param('attemptId') attemptId: string, @Req() req: StudentRequest) {
    return this.examAttemptService.submitAttempt(req.user.id, attemptId);
  }
}
