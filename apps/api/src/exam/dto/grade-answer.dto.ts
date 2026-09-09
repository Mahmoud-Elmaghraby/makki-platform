import { IsInt, Min, IsOptional, IsString } from 'class-validator';

// دي بس للأسئلة المقالية (ESSAY) — المدرب/الأدمن بيراجعها يدوي بعد التسليم.
export class GradeAnswerDto {
  @IsInt()
  @Min(0)
  pointsAwarded: number;

  @IsOptional()
  @IsString()
  teacherFeedback?: string;
}
