import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [PrismaModule, SectionModule],
  controllers: [CourseController, MediaController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
