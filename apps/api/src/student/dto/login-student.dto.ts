import { IsString, Matches, MinLength } from 'class-validator';

export class LoginStudentDto {
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'رقم التليفون لازم يكون رقم مصري صحيح (مثال: 01012345678)',
  })
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
