import { IsOptional, IsString, IsBoolean } from 'class-validator';

// السؤال بيحدد إنت هتملى أي حقل: MULTIPLE_CHOICE -> selectedOptionId،
// TRUE_FALSE -> booleanAnswer، ESSAY -> essayText. الـ service بيتجاهل أي
// حقل مش متوقع من نوع السؤال.
export class SubmitAnswerDto {
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @IsOptional()
  @IsBoolean()
  booleanAnswer?: boolean;

  @IsOptional()
  @IsString()
  essayText?: string;
}
