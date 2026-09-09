import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CheckpointService } from './checkpoint.service';
import { AnswerCheckpointDto } from './dto/checkpoint.dto';
import { OptionalStudentJwtAuthGuard } from '../student/guards/optional-student-jwt-auth.guard';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';

type OptionalStudentRequest = Request & { user: { id: string } | null };
type StudentRequest = Request & { user: { id: string } };

// راوتات الطالب (وزائر المعاينة المجانية) لأسئلة الفيديو — منفصلة عمدًا عن
// LessonController عشان checkpoint.module.ts يستورد lesson.module.ts في
// اتجاه واحد بس (يجيب LessonService) من غير ما يحصل circular dependency.
@Controller('lessons/:lessonId/checkpoints')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @UseGuards(OptionalStudentJwtAuthGuard)
  @Get()
  findAll(@Param('lessonId') lessonId: string, @Req() req: OptionalStudentRequest) {
    return this.checkpointService.findAllForViewer(lessonId, req.user?.id ?? null);
  }

  @UseGuards(StudentJwtAuthGuard)
  @Post(':checkpointId/answer')
  answer(
    @Param('lessonId') lessonId: string,
    @Param('checkpointId') checkpointId: string,
    @Body() dto: AnswerCheckpointDto,
    @Req() req: StudentRequest,
  ) {
    return this.checkpointService.submitAnswer(req.user.id, lessonId, checkpointId, dto);
  }
}
