import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/rate-limit.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(RateLimitGuard)
  @RateLimit({ perIdentifier: 8, perIp: 30, windowSeconds: 900, identifierField: 'email' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
