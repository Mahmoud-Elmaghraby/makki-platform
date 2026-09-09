import { Body, Controller, Get, Headers, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';

type StudentRequest = Request & { user: { id: string } };

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(StudentJwtAuthGuard)
  @Post('checkout')
  checkout(@Req() req: StudentRequest, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.initiateCheckout(req.user.id, dto.courseId);
  }

  @UseGuards(StudentJwtAuthGuard)
  @Get(':paymentId')
  getStatus(@Req() req: StudentRequest, @Param('paymentId') paymentId: string) {
    return this.paymentsService.getStatus(paymentId, req.user.id);
  }

  // مفيش auth guard هنا عمدًا — Kashier نفسها اللي بتبعت الطلب ده من السيرفر
  // بتاعها، مش المتصفح. الحماية الوحيدة والكافية هنا هي التحقق من توقيع
  // الـ HMAC جوه الـ service، مش JWT.
  @Post('webhook/kashier')
  @HttpCode(200)
  kashierWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.handleKashierWebhook(payload, headers);
  }
}
