import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  // بتتاخد بالاعتبار بس لو role جاي INSTRUCTOR — بتتحط في صف Instructor
  // المرتبط بالحساب.
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
