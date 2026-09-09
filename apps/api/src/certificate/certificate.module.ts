import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { CertificateAdminController } from './certificate-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';

// StorageModule بيه @Global()، فمش لازم يتحط هنا في imports صراحةً — لكن
// بنحطه برضه عشان الموديول يفضل واضح ومقروء لوحده من غير ما يعتمد ضمنيًا
// على الترتيب اللي الموديولات التانية بتتحمّل بيه.
import { StorageModule } from '../storage/storage.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, StorageModule, NotificationModule],
  controllers: [CertificateController, CertificateAdminController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
