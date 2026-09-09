import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
  IsEnum,
  Matches,
} from 'class-validator';
import { CourseTrack, Faculty, AcademicYear } from '../../generated/prisma/enums';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message:
      'الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات بس (مثال: intro-civil-law)',
  })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CourseTrack)
  track: CourseTrack;

  // محتوى صفحة تفاصيل الكورس العامة (زي كورسيرا) — كله اختياري، بيتعرض في
  // صفحة واحدة من غير تابات.
  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouWillLearn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsString()
  targetAudience?: string;


  // بس لكورسات قسم كورسات الكليات (STUDENT_COURSE) — كل كورس بيتبع كلية
  // وفرقة واحدة بالظبط.
  @IsOptional()
  @IsEnum(Faculty)
  faculty?: Faculty;

  @IsOptional()
  @IsEnum(AcademicYear)
  academicYear?: AcademicYear;

  @IsInt()
  @Min(0)
  priceEGP: number;

  // الأدمن بس اللي يقدر يحدد instructorId يدوي (لأي مدرب). لو مدرب هو
  // اللي بينشئ الكورس، الـ service بيتجاهل القيمة دي ويحطه هو تلقائيًا.
  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message:
      'الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات بس (مثال: intro-civil-law)',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CourseTrack)
  track?: CourseTrack;

  // محتوى صفحة تفاصيل الكورس العامة (زي كورسيرا) — كله اختياري، بيتعرض في
  // صفحة واحدة من غير تابات.
  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouWillLearn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsString()
  targetAudience?: string;


  @IsOptional()
  @IsEnum(Faculty)
  faculty?: Faculty;

  @IsOptional()
  @IsEnum(AcademicYear)
  academicYear?: AcademicYear;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceEGP?: number;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
