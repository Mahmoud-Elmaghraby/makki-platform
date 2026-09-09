import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ConsultationType } from '../../generated/prisma/enums';

export class CreateConsultationRequestDto {
  @IsEnum(ConsultationType)
  type: ConsultationType;

  @IsString()
  @IsNotEmpty()
  name: string;

  // نفس نمط رقم الموبايل المصري المتبع في باقي المشروع (تسجيل الطالب).
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, { message: 'رقم الهاتف غير صحيح' })
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
