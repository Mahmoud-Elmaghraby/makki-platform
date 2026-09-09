import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentAdminController } from './attachment-admin.controller';
import { AttachmentController } from './attachment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AttachmentAdminController, AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
