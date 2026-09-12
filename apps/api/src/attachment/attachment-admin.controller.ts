import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import { Request } from 'express';
import { AttachmentService } from './attachment.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

type ActorRequest = Request & { user: { role: Role; instructorId: string | null } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
@Controller('courses/:courseId/attachments')
export class AttachmentAdminController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get()
  findAll(@Param('courseId') courseId: string, @Req() req: ActorRequest) {
    return this.attachmentService.findAllForCourseAdmin(courseId, req.user);
  }

  @Post()
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAttachmentDto,
    @Req() req: ActorRequest,
  ) {
    return this.attachmentService.createForCourse(courseId, dto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Req() req: ActorRequest,
  ) {
    return this.attachmentService.remove(courseId, id, req.user);
  }

  // رفع ملف المرفق نفسه — بعد إنشاء سجل المرفق (create فوق)، بيعدي على
  // السيرفر بتاعنا (multer) وبعدين السيرفر يرفعه لـ B2.
  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: os.tmpdir() }),
      limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
    }),
  )
  uploadFile(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: ActorRequest,
  ) {
    return this.attachmentService.uploadForCourse(courseId, id, file, req.user);
  }
}
