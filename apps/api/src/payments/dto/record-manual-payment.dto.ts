import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

// تسجيل دفعة استلمت خارج المنصة (فودافون كاش، تحويل بنكي، كاش يدوي...)
// بعد ما الأدمن/المدير يتأكد من وصول الفلوس فعليًا. بيعمل حاجتين مع بعض:
// سجل دفعة PAID (عشان تظهر في تقارير الإيرادات) + تفعيل الاشتراك تلقائيًا،
// بدل ما يستخدم "تفعيل اشتراك يدوي" اللي مبيسجّلش أي دفعة خالص.
export class RecordManualPaymentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsInt()
  @Min(1)
  amountEGP: number;

  // مرجع الدفعة — رقم الهاتف اللي حوّل منه، رقم عملية التحويل، ... إلخ.
  @IsOptional()
  @IsString()
  reference?: string;
}
