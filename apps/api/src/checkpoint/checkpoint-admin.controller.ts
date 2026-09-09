import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CheckpointService } from './checkpoint.service';
import { CreateCheckpointDto, UpdateCheckpointDto } from './dto/checkpoint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

type ActorRequest = Request & { user: { role: Role; instructorId: string | null } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
@Controller('courses/:courseId/lessons/:lessonId/checkpoints')
export class CheckpointAdminController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @Get()
  findAll(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Req() req: ActorRequest,
  ) {
    return this.checkpointService.findAllForLessonAdmin(courseId, lessonId, req.user);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateCheckpointDto,
    @Req() req: ActorRequest,
  ) {
    return this.checkpointService.addCheckpoint(courseId, lessonId, dto, req.user);
  }

  @Patch(':checkpointId')
  update(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('checkpointId') checkpointId: string,
    @Body() dto: UpdateCheckpointDto,
    @Req() req: ActorRequest,
  ) {
    return this.checkpointService.updateCheckpoint(courseId, lessonId, checkpointId, dto, req.user);
  }

  @Delete(':checkpointId')
  remove(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('checkpointId') checkpointId: string,
    @Req() req: ActorRequest,
  ) {
    return this.checkpointService.removeCheckpoint(courseId, lessonId, checkpointId, req.user);
  }
}
