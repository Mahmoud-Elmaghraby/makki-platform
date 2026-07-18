import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ConsultingModule } from './modules/consulting/consulting.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CmsModule } from './modules/cms/cms.module';

@Module({
  imports: [AuthModule, CoursesModule, ConsultingModule, PaymentsModule, CmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
