import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { TranscodeModule } from './transcode/transcode.module';
import { AuthModule } from './auth/auth.module';
import { InstructorModule } from './instructor/instructor.module';
import { StudentModule } from './student/student.module';
import { CourseOwnershipModule } from './course/course-ownership.module';
import { CourseModule } from './course/course.module';
import { SectionModule } from './section/section.module';
import { LessonModule } from './lesson/lesson.module';
import { CheckpointModule } from './checkpoint/checkpoint.module';
import { CertificateModule } from './certificate/certificate.module';
import { ExamModule } from './exam/exam.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AttachmentModule } from './attachment/attachment.module';
import { PaymentsModule } from './payments/payments.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { ConsultationModule } from './consultation/consultation.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    TranscodeModule,
    CourseOwnershipModule,
    AuthModule,
    InstructorModule,
    StudentModule,
    CourseModule,
    SectionModule,
    LessonModule,
    CheckpointModule,
    CertificateModule,
    ExamModule,
    EnrollmentModule,
    AttachmentModule,
    PaymentsModule,
    UserModule,
    NotificationModule,
    ConsultationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
