import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { ConsultationAdminController } from './consultation-admin.controller';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [ConsultationController, ConsultationAdminController],
  providers: [ConsultationService],
})
export class ConsultationModule {}
