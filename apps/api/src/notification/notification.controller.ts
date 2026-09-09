import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';

type StudentRequest = Request & { user: { id: string } };

@UseGuards(StudentJwtAuthGuard)
@Controller('notifications/me')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@Req() req: StudentRequest) {
    return this.notificationService.listForStudent(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: StudentRequest) {
    return this.notificationService.markReadForStudent(req.user.id, id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: StudentRequest) {
    return this.notificationService.markAllReadForStudent(req.user.id);
  }
}
