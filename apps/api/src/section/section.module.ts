import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionAdminController } from './section-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SectionAdminController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}
