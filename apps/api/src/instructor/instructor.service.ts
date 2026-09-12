import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { B2StorageService } from '../storage/b2-storage.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { Role } from '../generated/prisma/enums';

// إدارة حسابات المدربين — الأدمن بس هو اللي يقدر ينشئ حساب مدرب جديد
// (المدرب مالوش تسجيل ذاتي، زي ما اتفقنا: أدمن + مدرب بس، مفيش تسجيل عام للمدربين).
@Injectable()
export class InstructorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly b2: B2StorageService,
  ) {}

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

  // رفع صورة المدرب الشخصية — نفس نمط رفع صورة غلاف الكورس بالظبط (presigned
  // PUT مباشر لـ B2 من غير ما الصورة تعدي على السيرفر بتاعنا). المفتاح ثابت
  // لكل مدرب (instructor-photos/{id})، فإعادة الرفع بتستبدل نفس الملف على B2
  // تلقائيًا. بنخزّن رابط الصورة الجاهز (عن طريق MediaController) مباشرة في
  // عمود photoUrl الموجود بالفعل — نفس العمود اللي كان بياخد رابط خارجي يدوي
  // قبل كده، فمفيش داعي لعمود جديد ولا لتعديل أي مكان تاني بيرجّع photoUrl.
  async getPhotoUploadUrl(id: string) {
    await this.ensureExists(id);
    const storageKey = `instructor-photos/${id}`;
    const { url, fields } = await this.b2.getPresignedPostPolicy(storageKey, {
      maxSizeBytes: 8 * 1024 * 1024, // 8MB كفاية جدًا لصورة شخصية
    });
    return { uploadUrl: url, uploadFields: fields, storageKey };
  }

  async confirmPhotoUpload(id: string, storageKey: string) {
    await this.ensureExists(id);
    if (storageKey !== `instructor-photos/${id}`) {
      throw new ForbiddenException('مفتاح الرفع مش متطابق مع المدرب ده');
    }
    const apiBase = process.env.API_PUBLIC_URL;
    const encoded = Buffer.from(storageKey).toString('base64url');
    // ?v= بتضمن إن الكاش (سنة كاملة، immutable على مستوى MediaController)
    // ميفضلش شايل نسخة قديمة بعد ما المدرب يغيّر صورته.
    const photoUrl = `${apiBase}/media/${encoded}?v=${Date.now()}`;
    return this.prisma.instructor.update({ where: { id }, data: { photoUrl } });
  }
}
