import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamAttemptService } from './exam-attempt.service';
import { ExamAdminController } from './exam-admin.controller';
import { ExamAttemptController } from './exam-attempt.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificateModule } from '../certificate/certificate.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, CertificateModule, NotificationModule],
  controllers: [ExamAdminController, ExamAttemptController],
  providers: [ExamService, ExamAttemptService],
  exports: [ExamService, ExamAttemptService],
})
export class ExamModule {}
