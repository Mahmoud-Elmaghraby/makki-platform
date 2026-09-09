import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationAudience, NotificationType } from '../generated/prisma/enums';

const LIST_LIMIT = 50;

type CreateAdminNotificationInput = {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

type CreateStudentNotificationInput = {
  studentId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

/**
 * نظام الإشعارات المركزي. كل الأحداث المهمة في المنصة (امتحان محتاج
 * تصحيح، طالب اشترك، امتحان اتصحح، شهادة اتصدرت، دفعة استلمت) بتتسجل
 * هنا عن طريق الخدمات التانية (ExamAttemptService، EnrollmentService،
 * CertificateService، PaymentsService) وقت ما الحدث بيحصل فعليًا.
 *
 * إشعارات الأدمن (audience=ADMIN) مشتركة بين كل فريق الأدمن/المدربين —
 * مفيش تتبّع لكل مستخدم لوحده، ده كافي لحجم الفريق الحالي ومنطق بسيط.
 * إشعارات الطالب (audience=STUDENT) مربوطة بـ studentId محدد.
 */
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyAdmin(input: CreateAdminNotificationInput) {
    return this.prisma.notification.create({
      data: {
        audience: NotificationAudience.ADMIN,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      },
    });
  }

  async notifyStudent(input: CreateStudentNotificationInput) {
    return this.prisma.notification.create({
      data: {
        audience: NotificationAudience.STUDENT,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        studentId: input.studentId,
      },
    });
  }

  async listForAdmin() {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { audience: NotificationAudience.ADMIN },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
      this.prisma.notification.count({
        where: { audience: NotificationAudience.ADMIN, isRead: false },
      }),
    ]);
    return { items, unreadCount };
  }

  async listForStudent(studentId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { audience: NotificationAudience.STUDENT, studentId },
        orderBy: { createdAt: 'desc' },
        take: LIST_LIMIT,
      }),
      this.prisma.notification.count({
        where: { audience: NotificationAudience.STUDENT, studentId, isRead: false },
      }),
    ]);
    return { items, unreadCount };
  }

  async markReadForAdmin(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.audience !== NotificationAudience.ADMIN) {
      throw new NotFoundException('الإشعار مش موجود');
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllReadForAdmin() {
    await this.prisma.notification.updateMany({
      where: { audience: NotificationAudience.ADMIN, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markReadForStudent(studentId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.audience !== NotificationAudience.STUDENT) {
      throw new NotFoundException('الإشعار مش موجود');
    }
    if (notification.studentId !== studentId) {
      throw new ForbiddenException('مفيش صلاحية للوصول للإشعار ده');
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllReadForStudent(studentId: string) {
    await this.prisma.notification.updateMany({
      where: { audience: NotificationAudience.STUDENT, studentId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }
}
