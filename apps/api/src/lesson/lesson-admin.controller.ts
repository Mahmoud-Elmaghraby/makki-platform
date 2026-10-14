import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import { Request } from 'express';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

type ActorRequest = Request & { user: { role: Role; instructorId: string | null } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
@Controller('courses/:courseId/lessons')
export class LessonAdminController {
  constructor(private readonly lessonService: LessonService) {}

  @Get()
  findAll(@Param('courseId') courseId: string, @Req() req: ActorRequest) {
    return this.lessonService.findAllForCourseAdmin(courseId, req.user);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
    @Req() req: ActorRequest,
  ) {
    return this.lessonService.createForCourse(courseId, dto, req.user);
  }

  // رفع فيديو الدرس — بيعدي على السيرفر بتاعنا (multer diskStorage عشان
  // الفيديوهات ممكن تكون كبيرة، فمش بنحمّلها كاملة في الذاكرة) وبعدين
  // السيرفر يرفعها لـ B2 ويجدول التحويل (transcode) تلقائيًا.
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: os.tmpdir() }),
      limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB (حماية مساحة السيرفر)
      // نقبل ملفات الفيديو بس (بالنوع أو بالامتداد) — بنرفض أي حاجة تانية
      // قبل ما تتخزن على القرص.
      fileFilter: (_req, file, cb) => {
        const okType = file.mimetype.startsWith('video/');
        const okExt = /\.(mp4|m4v|mov|mkv|webm|avi)$/i.test(file.originalname);
        if (okType || okExt) return cb(null, true);
        cb(new BadRequestException('الملف لازم يكون فيديو (mp4 أو mov أو mkv أو webm).'), false);
      },
    }),
  )
  uploadVideo(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: ActorRequest,
  ) {
    return this.lessonService.uploadVideo(courseId, id, file, req.user);
  }

  @Get(':id/status')
  getStatus(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Req() req: ActorRequest,
  ) {
    return this.lessonService.getStatus(courseId, id, req.user);
  }

  @Patch(':id')
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Req() req: ActorRequest,
  ) {
    return this.lessonService.updateMeta(courseId, id, dto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Req() req: ActorRequest,
  ) {
    return this.lessonService.remove(courseId, id, req.user);
  }
}
