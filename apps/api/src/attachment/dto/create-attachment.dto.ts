import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  // اسم الملف الأصلي — بنستخدمه بس عشان نحافظ على الامتداد (.pdf, .docx...)
  // في الـ storageKey؛ مش بيتخزن كعمود لوحده.
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;
}
