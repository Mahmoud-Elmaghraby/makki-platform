import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma/enums';

export interface Actor {
  role: Role;
  instructorId: string | null;
}

// خدمة صغيرة مستقلة (بتعتمد على Prisma بس) بتتأكد إن الكورس ملك المدرب
// صاحب التوكن قبل ما يعدّل أي حاجة جواه (قسم/درس/امتحان/مرفق). اتحطت في
// موديول لوحده (Global) عشان section/lesson/exam/attachment يقدروا
// يستخدموها من غير ما يعملوا circular dependency مع CourseModule.
@Injectable()
export class CourseOwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCourseOwnership(courseId: string, actor: Actor) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) throw new NotFoundException('الكورس مش موجود');
    if (actor.role === Role.INSTRUCTOR && course.instructorId !== actor.instructorId) {
      throw new ForbiddenException('الكورس ده مش ملكك');
    }
  }
}
