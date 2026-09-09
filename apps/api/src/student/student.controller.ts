import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StudentService } from './student.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { ChangeStudentPasswordDto } from './dto/change-student-password.dto';
import { StudentJwtAuthGuard } from './guards/student-jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { GoogleProfilePayload } from './strategies/google.strategy';

@Controller('auth/student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterStudentDto) {
    return this.studentService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginStudentDto) {
    return this.studentService.login(dto);
  }

  // بنستخدم الجارد بس عشان يعمل ريدايركت لصفحة موافقة جوجل — مفيش هاندلر
  // فعلي هنا، باسبورت بيتصرف قبل ما يوصل للميثود.
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleProfilePayload },
    @Res() res: Response,
  ) {
    const frontendOrigin = (
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'
    ).split(',')[0];

    try {
      const { access_token } =
        await this.studentService.loginOrRegisterWithGoogle(req.user);
      res.redirect(
        `${frontendOrigin}/student/oauth-callback?token=${access_token}`,
      );
    } catch {
      res.redirect(`${frontendOrigin}/student/login?error=google`);
    }
  }

  @UseGuards(StudentJwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: { id: string } }) {
    return this.studentService.getProfile(req.user.id);
  }

  @UseGuards(StudentJwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: ChangeStudentPasswordDto,
  ) {
    return this.studentService.changePassword(req.user.id, dto);
  }
}
