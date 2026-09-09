import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorService } from '../instructor/instructor.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../generated/prisma/enums';

/**
 * إدارة موحّدة لكل حسابات الطاقم (أدمن/مدير/مدرب) — بدل ما تكون إدارة
 * المدربين لوحدها في مكان، ومفيش أي واجهة لإضافة أدمن أو مدير جديد غير
 * سكربت تقني (seed-admin.ts). الأدمن بس هو اللي يقدر يوصل هنا (الـ
 * controller بيفرضها)، عشان إدارة حسابات الطاقم نفسها حاجة حساسة.
 */
@Injectable()
export class UserAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instructorService: InstructorService,
  ) {}

  async adminList() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        instructor: {
          select: {
            id: true,
            bio: true,
            photoUrl: true,
            _count: { select: { courses: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminCreate(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('الإيميل ده مستخدم بالفعل');

    if (dto.role === Role.INSTRUCTOR) {
      // بنستخدم نفس منطق إنشاء المدرب الموجود بالفعل (بيعمل Instructor +
      // User في عملية واحدة) عشان ميتكررش الكود ونضمن نفس سلوك الـ cascade
      // وقت الحذف.
      return this.instructorService.create({
        name: dto.name,
        email: dto.email,
        password: dto.password,
        bio: dto.bio,
        photoUrl: dto.photoUrl,
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async adminUpdate(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { instructor: true },
    });
    if (!user) throw new NotFoundException('المستخدم مش موجود');

    const userData: { name?: string; passwordHash?: string } = {};
    if (dto.name !== undefined) userData.name = dto.name;
    if (dto.password) userData.passwordHash = await bcrypt.hash(dto.password, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userData,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // لو الحساب ده مدرب، لازم نحدّث صف Instructor المرتبط بيه كمان — ده
    // اللي فعليًا بيظهر في الكورسات (course.instructor.name)، مش User.name.
    // من غيرها، تغيير اسم المستخدم هنا كان بيتحدّث في جدول User بس ويفضل
    // الاسم القديم ظاهر في كل صفحات الكورسات (باگ اتكشف فعليًا).
    if (
      user.instructor &&
      (dto.name !== undefined || dto.bio !== undefined || dto.photoUrl !== undefined)
    ) {
      await this.prisma.instructor.update({
        where: { id: user.instructor.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
          ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        },
      });
    }

    return updatedUser;
  }

  async adminDelete(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ForbiddenException('متقدرش تمسح حسابك انت شخصيًا وانت داخل بيه');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم مش موجود');

    // حذف صف User بيسحب معاه صف Instructor تلقائيًا لو موجود (onDelete:
    // Cascade على Instructor.userId) — مفيش حاجة إضافية مطلوبة هنا.
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
