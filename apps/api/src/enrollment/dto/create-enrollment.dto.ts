import { IsString, IsNotEmpty } from 'class-validator';

// إضافة اشتراك يدوي — استخدام استثنائي لحد ما يخلص موديول الدفع (Phase 2)،
// أو لحالات خاصة بعد كده (كورس مجاني، اتفاق خاص، ... إلخ).
export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;
}
