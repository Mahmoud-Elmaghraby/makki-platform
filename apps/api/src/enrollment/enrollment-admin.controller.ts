import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('enrollments')
export class EnrollmentAdminController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get()
  findAll(@Query('courseId') courseId?: string, @Query('studentId') studentId?: string) {
    return this.enrollmentService.adminList({ courseId, studentId });
  }

  @Post()
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.adminEnroll(dto);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.enrollmentService.adminRevoke(id);
  }
}
