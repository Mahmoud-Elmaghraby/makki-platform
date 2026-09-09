import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CreateConsultationRequestDto } from './dto/create-consultation-request.dto';

// مفيش auth guard هنا عمدًا — دي صفحة "تواصل معنا" العامة، أي زائر للموقع
// (حتى لو مش مسجّل دخول) لازم يقدر يبعت طلب.
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateConsultationRequestDto) {
    return this.consultationService.create(dto);
  }
}
