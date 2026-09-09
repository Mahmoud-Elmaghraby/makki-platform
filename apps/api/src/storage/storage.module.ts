import { Global, Module } from '@nestjs/common';
import { B2StorageService } from './b2-storage.service';

@Global()
@Module({
  providers: [B2StorageService],
  exports: [B2StorageService],
})
export class StorageModule {}
