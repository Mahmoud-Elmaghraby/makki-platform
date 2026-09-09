import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstructorModule } from '../instructor/instructor.module';
import { UserAdminController } from './user-admin.controller';
import { UserAdminService } from './user-admin.service';

@Module({
  imports: [PrismaModule, InstructorModule],
  controllers: [UserAdminController],
  providers: [UserAdminService],
})
export class UserModule {}
