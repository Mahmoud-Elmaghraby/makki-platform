import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Header,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LessonService } from './lesson.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { OptionalStudentJwtAuthGuard } from '../student/guards/optional-student-jwt-auth.guard';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';
import { HlsManifestTokenGuard } from './guards/hls-manifest-token.guard';

type OptionalStudentRequest = Request & { user: { id: string } | null };
type StudentRequest = Request & { user: { id: string } };
// نفس Request بالظبط، بس كـ alias محلي — لازم عشان التوكن يتقرا من query.
// (استخدام Request المستوردة مباشرة كنوع لباراميتر متزين بـ @Req() بيدّي
// تعارض مع isolatedModules + emitDecoratorMetadata).
type ManifestRequest = Request;

// كل الراوتات هنا خاصة بتشغيل الفيديو للطالب (أو الزائر في حالة الدرس المجاني
// للمعاينة) — ملاحظة: مفيش /courses/:courseId هنا لأن الدرس بيتعرّف بالـ id
// بتاعه بس، والصلاحية بتتفحص جوه الـ service (enrollment / free preview).
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @UseGuards(OptionalStudentJwtAuthGuard)
  @Get(':id/playback-token')
  getPlaybackToken(
    @Param('id') id: string,
    @Req() req: OptionalStudentRequest,
  ) {
    return this.lessonService.getPlaybackToken(id, req.user?.id ?? null);
  }

  @UseGuards(StudentJwtAuthGuard)
  @Post(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @Req() req: StudentRequest,
  ) {
    return this.lessonService.updateProgress(req.user.id, id, dto);
  }

  @UseGuards(HlsManifestTokenGuard)
  @Header('Content-Type', 'application/vnd.apple.mpegurl')
  @Get(':id/hls/master.m3u8')
  getMasterManifest(
    @Param('id') id: string,
    @Req() req: ManifestRequest,
  ) {
    const token = req.query.token as string;
    return this.lessonService.getMasterManifest(id, token);
  }

  @UseGuards(HlsManifestTokenGuard)
  @Header('Content-Type', 'application/vnd.apple.mpegurl')
  @Get(':id/hls/:variant/playlist.m3u8')
  getVariantManifest(
    @Param('id') id: string,
    @Param('variant') variant: string,
  ) {
    return this.lessonService.getVariantManifest(id, variant);
  }
}
