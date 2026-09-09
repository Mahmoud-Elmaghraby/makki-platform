import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationAdminController } from './notification-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController, NotificationAdminController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
