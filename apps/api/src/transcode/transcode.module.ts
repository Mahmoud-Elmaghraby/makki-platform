import { Module } from '@nestjs/common';
import { TranscodeQueueService } from './transcode-queue.service';
import { TranscodeProcessor } from './transcode.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [TranscodeQueueService, TranscodeProcessor],
  exports: [TranscodeQueueService, TranscodeProcessor],
})
export class TranscodeModule {}
