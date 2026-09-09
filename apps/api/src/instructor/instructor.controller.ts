import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

// قراءة قايمة المدربين بس (مستخدمة في اختيار مدرب الكورس وقت إنشاء/تعديل
// كورس). إدارة حسابات المدربين (إنشاء/تعديل/حذف) بقت من خلال وحدة
// "المستخدمين" الموحّدة (apps/api/src/user/) عشان الأدمن يقدر يضيف أي نوع
// حساب (أدمن/مدير/مدرب) من مكان واحد.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('instructors')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get()
  findAll() {
    return this.instructorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instructorService.findOne(id);
  }

  // رفع صورة المدرب الشخصية من واجهة إدارة المستخدمين — نفس نمط رفع صورة
  // غلاف الكورس (شوف CourseController).
  @Post(':id/photo-upload-url')
  getPhotoUploadUrl(@Param('id') id: string) {
    return this.instructorService.getPhotoUploadUrl(id);
  }

  @Post(':id/confirm-photo-upload')
  confirmPhotoUpload(
    @Param('id') id: string,
    @Body('storageKey') storageKey: string,
  ) {
    return this.instructorService.confirmPhotoUpload(id, storageKey);
  }
}
