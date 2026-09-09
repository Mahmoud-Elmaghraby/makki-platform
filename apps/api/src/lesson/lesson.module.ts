import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LessonService } from './lesson.service';
import { LessonAdminController } from './lesson-admin.controller';
import { LessonController } from './lesson.controller';
import { HlsTokenService } from './hls-token.service';
import { HlsManifestTokenGuard } from './guards/hls-manifest-token.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { TranscodeModule } from '../transcode/transcode.module';
import { CertificateModule } from '../certificate/certificate.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    TranscodeModule,
    CertificateModule,
    // توكن الـ HLS ده منفصل تمامًا عن جلسة تسجيل الدخول (Admin أو Student) —
    // نفس الـ JWT_SECRET بس مدة صلاحية مختلفة قصيرة (PLAYBACK_SESSION_TTL)،
    // وبيتحقق منه يدويًا في HlsTokenService مش عبر استراتيجية Passport.
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [LessonAdminController, LessonController],
  providers: [LessonService, HlsTokenService, HlsManifestTokenGuard],
  exports: [LessonService],
})
export class LessonModule {}
