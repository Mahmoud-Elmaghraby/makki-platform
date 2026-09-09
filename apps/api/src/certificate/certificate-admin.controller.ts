import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/certificates')
export class CertificateAdminController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get()
  findAll(@Query('courseId') courseId?: string) {
    return this.certificateService.adminList(courseId);
  }
}
