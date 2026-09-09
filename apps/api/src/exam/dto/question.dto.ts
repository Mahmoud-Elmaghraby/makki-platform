import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';
import { QuestionType } from '../../generated/prisma/enums';

// شكل كل عنصر جوه options (لأسئلة الاختيار من متعدد) هو { id, text } —
// بيتخزن زي ما هو في عمود Json من غير تحقق متداخل، اتساقًا مع الأسلوب
// المبسّط المتفق عليه (بدون class-transformer/ValidateNested لحاجة بسيطة).
export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsArray()
  options?: { id: string; text: string }[];

  @IsOptional()
  @IsString()
  correctOptionId?: string;

  @IsOptional()
  @IsBoolean()
  correctBoolean?: boolean;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsArray()
  options?: { id: string; text: string }[];

  @IsOptional()
  @IsString()
  correctOptionId?: string;

  @IsOptional()
  @IsBoolean()
  correctBoolean?: boolean;
}
