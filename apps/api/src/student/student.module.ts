import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { StudentAdminController } from './student-admin.controller';
import { StudentJwtStrategy } from './strategies/student-jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [StudentController, StudentAdminController],
  providers: [StudentService, StudentJwtStrategy, GoogleStrategy],
  exports: [StudentService],
})
export class StudentModule {}
