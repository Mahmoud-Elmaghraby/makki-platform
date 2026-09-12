import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import { Request } from 'express';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';
import { OptionalStudentJwtAuthGuard } from '../student/guards/optional-student-jwt-auth.guard';

export type OptionalStudentRequest = Request & { user: { id: string } | null };
type ActorRequest = Request & { user: { role: Role; instructorId: string | null } };

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  findPublished(
    @Query('track') track?: string,
    @Query('faculty') faculty?: string,
    @Query('academicYear') academicYear?: string,
    @Query('q') q?: string,
  ) {
    return this.courseService.findPublished(track, faculty, academicYear, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
  @Get('all')
  findAllAdmin(@Req() req: ActorRequest) {
    return this.courseService.findAllAdmin(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string, @Req() req: ActorRequest) {
    return this.courseService.findOneAdmin(id, req.user);
  }

  @UseGuards(OptionalStudentJwtAuthGuard)
  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Req() req: OptionalStudentRequest) {
    return this.courseService.findBySlugForViewer(slug, req.user?.id ?? null);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
  @Post()
  create(@Body() dto: CreateCourseDto, @Req() req: ActorRequest) {
    return this.courseService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Req() req: ActorRequest,
  ) {
    return this.courseService.update(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: ActorRequest) {
    return this.courseService.remove(id, req.user);
  }

  // رفع صورة غلاف الكورس — بتعدي على السيرفر بتاعنا (multer) وبعدين السيرفر
  // هو اللي يرفعها لـ B2 من غير أي رفع مباشر من المتصفح (كان بيتعمل بـ
  // presigned POST قبل كده، لكن B2 بترفض preflight الـ CORS بتاعه بـ 403).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.INSTRUCTOR)
  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: os.tmpdir() }),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8MB كفاية جدًا لصورة غلاف
    }),
  )
  uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: ActorRequest,
  ) {
    return this.courseService.uploadCover(id, file, req.user);
  }
}
