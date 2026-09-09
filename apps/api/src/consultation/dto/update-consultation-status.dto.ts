import { IsEnum } from 'class-validator';
import { ConsultationStatus } from '../../generated/prisma/enums';

export class UpdateConsultationStatusDto {
  @IsEnum(ConsultationStatus)
  status: ConsultationStatus;
}
