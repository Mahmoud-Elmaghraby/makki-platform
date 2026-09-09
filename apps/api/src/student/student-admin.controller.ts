import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentAdminDto } from './dto/create-student-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

// استخدام إداري استثنائي (دفع أوفلاين). الطريقة الأساسية للطالب هي
// POST /auth/student/register.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('students')
export class StudentAdminController {
  constructor(private readonly studentService: StudentService) {}

  @Get('all')
  findAll() {
    return this.studentService.findAllForAdmin();
  }

  @Post()
  create(@Body() dto: CreateStudentAdminDto) {
    return this.studentService.createByAdmin(dto);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.studentService.resetPasswordByAdmin(id);
  }

  @Patch(':id/status')
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.studentService.setActiveByAdmin(id, isActive);
  }
}
