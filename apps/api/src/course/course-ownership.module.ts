import { Global, Module } from '@nestjs/common';
import { CourseOwnershipService } from './course-ownership.service';

@Global()
@Module({
  providers: [CourseOwnershipService],
  exports: [CourseOwnershipService],
})
export class CourseOwnershipModule {}
