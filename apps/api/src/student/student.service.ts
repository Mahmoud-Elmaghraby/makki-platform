import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { CreateStudentAdminDto } from './dto/create-student-admin.dto';
import { ChangeStudentPasswordDto } from './dto/change-student-password.dto';
import { GoogleProfilePayload } from './strategies/google.strategy';

const PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ---- تسجيل ذاتي (الطريقة الأساسية لمكي) ----

  async register(dto: RegisterStudentDto) {
    const existingByPhone = await this.prisma.student.findUnique({
      where: { phone: dto.phone },
    });
    if (existingByPhone?.passwordHash) {
      throw new ConflictException('في حساب مسجل بالرقم ده بالفعل');
    }

    if (dto.email) {
      const existingByEmail = await this.prisma.student.findUnique({
        where: { email: dto.email },
      });
      if (existingByEmail && existingByEmail.id !== existingByPhone?.id) {
        throw new ConflictException('الإيميل ده مستخدم بالفعل');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const student = existingByPhone
      ? await this.prisma.student.update({
          where: { id: existingByPhone.id },
          data: { name: dto.name, email: dto.email, passwordHash },
        })
      : await this.prisma.student.create({
          data: {
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            passwordHash,
          },
        });

    return this.signToken(student);
  }

  async login(dto: LoginStudentDto) {
    const student = await this.prisma.student.findUnique({
      where: { phone: dto.phone },
    });

    if (!student || !student.passwordHash) {
      throw new UnauthorizedException('بيانات الدخول غلط');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      student.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('بيانات الدخول غلط');
    }

    if (!student.isActive) {
      throw new UnauthorizedException('الحساب ده متوقف، تواصل مع مكي');
    }

    return this.signToken(student);
  }

  // ---- تسجيل الدخول بجوجل ----

  async loginOrRegisterWithGoogle(profile: GoogleProfilePayload) {
    let student = await this.prisma.student.findUnique({
      where: { googleId: profile.googleId },
    });

    // مفيش حساب بجوجل ده لسه، بس ممكن يكون عنده حساب قديم بنفس الإيميل
    // (اتسجل الأول برقم التليفون) — نربطهم بدل ما نعمل حساب مكرر.
    if (!student && profile.email) {
      const existingByEmail = await this.prisma.student.findUnique({
        where: { email: profile.email },
      });
      if (existingByEmail) {
        student = await this.prisma.student.update({
          where: { id: existingByEmail.id },
          data: { googleId: profile.googleId },
        });
      }
    }

    if (!student) {
      student = await this.prisma.student.create({
        data: {
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
        },
      });
    }

    if (!student.isActive) {
      throw new UnauthorizedException('الحساب ده متوقف، تواصل مع مكي');
    }

    return this.signToken(student);
  }

  async getProfile(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { course: true },
        },
        certificates: true,
      },
    });

    if (!student) throw new NotFoundException('الطالب مش موجود');

    return {
      id: student.id,
      name: student.name,
      phone: student.phone,
      email: student.email,
      enrollments: student.enrollments,
      certificates: student.certificates,
    };
  }

  async changePassword(studentId: string, dto: ChangeStudentPasswordDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student?.passwordHash) throw new NotFoundException('الطالب مش موجود');

    const valid = await bcrypt.compare(
      dto.currentPassword,
      student.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('الباسورد الحالي غلط');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.student.update({
      where: { id: studentId },
      data: { passwordHash },
    });

    return { success: true };
  }

  // ---- استخدام إداري: حالات استثنائية (دفع أوفلاين/تحويل بنكي) ----

  async findAllForAdmin() {
    const students = await this.prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        enrollments: { include: { course: true } },
      },
    });
    return students.map((s) => this.toPublicStudent(s));
  }

  async createByAdmin(dto: CreateStudentAdminDto) {
    const existing = await this.prisma.student.findUnique({
      where: { phone: dto.phone },
    });

    if (existing?.passwordHash) {
      throw new ConflictException('الرقم ده مسجل بالفعل كطالب عنده حساب');
    }

    if (dto.email) {
      const emailTaken = await this.prisma.student.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken && emailTaken.id !== existing?.id) {
        throw new ConflictException('الإيميل ده مستخدم بالفعل');
      }
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const student = existing
      ? await this.prisma.student.update({
          where: { id: existing.id },
          data: { name: dto.name, email: dto.email, passwordHash },
        })
      : await this.prisma.student.create({
          data: {
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            passwordHash,
          },
        });

    return { student: this.toPublicStudent(student), temporaryPassword };
  }

  async resetPasswordByAdmin(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('الطالب مش موجود');

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.prisma.student.update({
      where: { id: studentId },
      data: { passwordHash },
    });

    return { temporaryPassword };
  }

  async setActiveByAdmin(studentId: string, isActive: boolean) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('الطالب مش موجود');

    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { isActive },
    });
    return this.toPublicStudent(updated);
  }

  private generateTemporaryPassword(): string {
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
    }
    return password;
  }

  private toPublicStudent<T extends { passwordHash: string | null }>(
    student: T,
  ): Omit<T, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...rest } = student;
    return rest;
  }

  private async signToken(student: { id: string; phone: string | null }) {
    const payload = {
      sub: student.id,
      phone: student.phone,
      type: 'student' as const,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      student: { id: student.id, phone: student.phone },
    };
  }
}
