import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsAdminController } from './payments-admin.controller';
import { KashierProvider } from './providers/kashier.provider';

@Module({
  imports: [PrismaModule, EnrollmentModule, NotificationModule],
  controllers: [PaymentsController, PaymentsAdminController],
  providers: [PaymentsService, KashierProvider],
})
export class PaymentsModule {}
