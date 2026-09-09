import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AttachmentService } from './attachment.service';
import { OptionalStudentJwtAuthGuard } from '../student/guards/optional-student-jwt-auth.guard';

type OptionalStudentRequest = Request & { user: { id: string } | null };

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @UseGuards(OptionalStudentJwtAuthGuard)
  @Get(':id/download-url')
  getDownloadUrl(@Param('id') id: string, @Req() req: OptionalStudentRequest) {
    return this.attachmentService.getDownloadUrl(id, req.user?.id ?? null);
  }
}
