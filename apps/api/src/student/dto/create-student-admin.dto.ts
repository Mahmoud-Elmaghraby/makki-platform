import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

// الأدمن بيستخدمها في حالات استثنائية بس (طالب دفع أوفلاين/تحويل بنكي)،
// مش الطريقة الأساسية — الطريقة الأساسية هي التسجيل الذاتي + الدفع.
export class CreateStudentAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'رقم التليفون لازم يكون رقم مصري صحيح (مثال: 01012345678)',
  })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
