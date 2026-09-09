import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, PaymentStatus } from '../generated/prisma/enums';

/**
 * لوحة الأدمن — عرض المدفوعات والإيرادات، بالإضافة لتسجيل دفعة استلمت يدوي
 * (فودافون كاش/تحويل بنكي) بعد التأكد من وصولها. المدفوعات عن طريق كاشير
 * نفسها بتتغيّر حالتها بس من خلال webhook كاشير (PaymentsController).
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query('status') status?: PaymentStatus, @Query('courseId') courseId?: string) {
    return this.paymentsService.adminList({ status, courseId });
  }

  @Get('stats')
  stats() {
    return this.paymentsService.adminStats();
  }

  @Post('manual')
  recordManual(@Body() dto: RecordManualPaymentDto) {
    return this.paymentsService.adminRecordManualPayment(dto);
  }
}
