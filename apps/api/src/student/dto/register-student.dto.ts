import { IsString, IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

// تسجيل ذاتي — مختلف عن new-mistak (اللي كان الأدمن بس بيضيف الطلاب يدويًا).
// مكي منصة بيع كورسات علنية، فالطالب لازم يقدر يسجل حساب بنفسه قبل الشراء.
export class RegisterStudentDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'رقم التليفون لازم يكون رقم مصري صحيح (مثال: 01012345678)',
  })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
