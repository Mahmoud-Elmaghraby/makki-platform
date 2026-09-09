import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LessonModule } from '../lesson/lesson.module';
import { CheckpointService } from './checkpoint.service';
import { CheckpointAdminController } from './checkpoint-admin.controller';
import { CheckpointController } from './checkpoint.controller';

// CourseOwnershipService مش لازم يتحط هنا في imports — موديوله @Global()
// (راجع course-ownership.module.ts).
@Module({
  imports: [PrismaModule, LessonModule],
  controllers: [CheckpointAdminController, CheckpointController],
  providers: [CheckpointService],
})
export class CheckpointModule {}
