import { IsString, IsOptional, MinLength } from 'class-validator';

// تعديل بيانات مستخدم موجود — مفيش تغيير للإيميل أو الدور هنا عن قصد (تغيير
// الدور بعد الإنشاء معقّد لإنه بيأثر على علاقة Instructor، فمش متاح في النسخة
// دي؛ لو محتاجين تغيير دور مستخدم لازم نمسحه وننشئه تاني بالدور الصح).
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
