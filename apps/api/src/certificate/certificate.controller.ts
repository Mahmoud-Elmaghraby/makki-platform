import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CertificateService } from './certificate.service';
import { StudentJwtAuthGuard } from '../student/guards/student-jwt-auth.guard';

type StudentRequest = Request & { user: { id: string } };

@UseGuards(StudentJwtAuthGuard)
@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('me')
  listMine(@Req() req: StudentRequest) {
    return this.certificateService.listForStudent(req.user.id);
  }

  @Get(':id/download-url')
  getDownloadUrl(@Param('id') id: string, @Req() req: StudentRequest) {
    return this.certificateService.getDownloadUrl(id, req.user.id);
  }
}
