import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { EnrollmentService } from './enrollment.service';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';

type StudentRequest = Request & { user: { id: string } };

@UseGuards(StudentJwtAuthGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('me')
  listMine(@Req() req: StudentRequest) {
    return this.enrollmentService.listForStudent(req.user.id);
  }
}
