import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentStatus, NotificationType } from '../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';
import { buildCoverImageUrl } from '../course/cover-image.util';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * تفعيل اشتراك يدوي (بديل مؤقت لحد ما يشتغل الدفع في Phase 2). لو الطالب
   * كان متسجل قبل كده وترفض/اتلغى اشتراكه (REVOKED)، بنعيد تفعيله بدل ما
   * نعمل صف جديد (فيه unique constraint على [studentId, courseId]).
   */
  async adminEnroll(dto: CreateEnrollmentDto) {
    const [student, course] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: dto.studentId } }),
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    ]);
    if (!student) throw new NotFoundException('الطالب مش موجود');
    if (!course) throw new NotFoundException('الكورس مش موجود');

    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: dto.studentId, courseId: dto.courseId } },
    });
    if (existing) {
      if (existing.status === EnrollmentStatus.ACTIVE) {
        throw new ConflictException('الطالب مشترك في الكورس ده بالفعل');
      }
      const reactivated = await this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: EnrollmentStatus.ACTIVE },
      });
      await this.notificationService.notifyAdmin({
        type: NotificationType.STUDENT_ENROLLED,
        title: `الطالب ${student.name} اشترك في ${course.title}`,
        link: `/admin/enrollments`,
      });
      return reactivated;
    }

    const created = await this.prisma.enrollment.create({
      data: { studentId: dto.studentId, courseId: dto.courseId },
    });
    await this.notificationService.notifyAdmin({
      type: NotificationType.STUDENT_ENROLLED,
      title: `الطالب ${student.name} اشترك في ${course.title}`,
      link: `/admin/enrollments`,
    });
    return created;
  }

  async adminRevoke(enrollmentId: string) {
    await this.ensureExists(enrollmentId);
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.REVOKED },
    });
  }

  /** لوحة الأدمن — قائمة الاشتراكات، بفلترة اختيارية بالكورس و/أو بالطالب
   * (عشان تقدر تشوف كل اشتراكات طالب معيّن في كل الكورسات في مكان واحد،
   * أو كل المشتركين في كورس معيّن، أو الاتنين مع بعض). */
  async adminList(filters: { courseId?: string; studentId?: string } = {}) {
    return this.prisma.enrollment.findMany({
      where: {
        courseId: filters.courseId,
        studentId: filters.studentId,
      },
      include: {
        student: { select: { id: true, name: true, phone: true, email: true } },
        course: { select: { id: true, title: true, track: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * "كورساتي" — بترجع كل اشتراك نشط للطالب + نسبة تقدمه في الدروس المنشورة
   * (نسبة بسيطة بناءً على عدد الدروس المكتملة، مش شرط إصدار الشهادة الكامل
   * اللي بيدخل فيه الامتحانات كمان — ده بس مؤشر تقدّم للعرض في القائمة).
   */
  async listForStudent(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: EnrollmentStatus.ACTIVE },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            track: true,
            coverImageKey: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const { coverImageKey, updatedAt, ...courseRest } = enrollment.course;
        const course = { ...courseRest, coverImageUrl: buildCoverImageUrl({ coverImageKey, updatedAt }) };
        const [totalLessons, completedLessons] = await Promise.all([
          this.prisma.lesson.count({
            where: { courseId: enrollment.courseId, isPublished: true },
          }),
          this.prisma.lessonProgress.count({
            where: {
              studentId,
              completed: true,
              lesson: { courseId: enrollment.courseId, isPublished: true },
            },
          }),
        ]);
        const progressPercent =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return { ...enrollment, course, totalLessons, completedLessons, progressPercent };
      }),
    );
  }

  private async ensureExists(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('الاشتراك مش موجود');
    return enrollment;
  }
}
