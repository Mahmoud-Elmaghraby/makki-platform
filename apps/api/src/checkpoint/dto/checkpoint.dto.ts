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
import { CheckpointQuestionType } from '../../generated/prisma/enums';

// شكل عناصر options زي question.dto.ts بالظبط: { id, text } بيتخزن في عمود
// Json من غير تحقق متداخل — نفس الأسلوب المبسّط المتفق عليه في المشروع.
export class CreateCheckpointDto {
  @IsInt()
  @Min(0)
  timestampSeconds: number;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsEnum(CheckpointQuestionType)
  type: CheckpointQuestionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

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

export class UpdateCheckpointDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  timestampSeconds?: number;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsEnum(CheckpointQuestionType)
  type?: CheckpointQuestionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

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

export class AnswerCheckpointDto {
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @IsOptional()
  @IsBoolean()
  booleanAnswer?: boolean;
}
