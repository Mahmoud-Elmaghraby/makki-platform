import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
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
  // غلاف الكورس (شوف CourseController): الملف بيعدي على السيرفر بتاعنا
  // (multer) وبعدين السيرفر يرفعه لـ B2.
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: os.tmpdir() }),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8MB كفاية جدًا لصورة شخصية
    }),
  )
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.instructorService.uploadPhoto(id, file);
  }
}
