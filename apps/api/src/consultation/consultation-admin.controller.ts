import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { UpdateConsultationStatusDto } from './dto/update-consultation-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ConsultationStatus, ConsultationType } from '../generated/prisma/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/consultations')
export class ConsultationAdminController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get()
  findAll(
    @Query('status') status?: ConsultationStatus,
    @Query('type') type?: ConsultationType,
  ) {
    return this.consultationService.adminList({ status, type });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateConsultationStatusDto) {
    return this.consultationService.adminUpdateStatus(id, dto);
  }
}
