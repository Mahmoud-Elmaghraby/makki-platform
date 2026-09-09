import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { Role } from '../generated/prisma/enums';

// إدارة حسابات المدربين — الأدمن بس هو اللي يقدر ينشئ حساب مدرب جديد
// (المدرب مالوش تسجيل ذاتي، زي ما اتفقنا: أدمن + مدرب بس، مفيش تسجيل عام للمدربين).
@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInstructorDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('الإيميل ده مستخدم بالفعل');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.instructor.create({
      data: {
        name: dto.name,
        bio: dto.bio,
        photoUrl: dto.photoUrl,
        user: {
          create: {
            email: dto.email,
            passwordHash,
            name: dto.name,
            role: Role.INSTRUCTOR,
          },
        },
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  findAll() {
    return this.prisma.instructor.findMany({
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { courses: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } }, courses: true },
    });
    if (!instructor) throw new NotFoundException('المدرب مش موجود');
    return instructor;
  }

  async update(id: string, dto: UpdateInstructorDto) {
    await this.ensureExists(id);
    return this.prisma.instructor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const instructor = await this.ensureExists(id);
    // لازم نحذف من جهة User: علاقة onDelete:Cascade متعرّفة على Instructor.userId،
    // يعني حذف User هو اللي بيسحب معاه Instructor تلقائيًا — العكس مش بيحصل.
    return this.prisma.user.delete({ where: { id: instructor.userId } });
  }

  private async ensureExists(id: string) {
    const instructor = await this.prisma.instructor.findUnique({ where: { id } });
    if (!instructor) throw new NotFoundException('المدرب مش موجود');
    return instructor;
  }
}
