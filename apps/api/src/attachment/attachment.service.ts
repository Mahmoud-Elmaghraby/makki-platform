import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { B2StorageService } from '../storage/b2-storage.service';
import { CourseOwnershipService, Actor } from '../course/course-ownership.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { EnrollmentStatus } from '../generated/prisma/enums';

const DOWNLOAD_TTL_SECONDS = 15 * 60;

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly b2: B2StorageService,
    private readonly ownership: CourseOwnershipService,
  ) {}

  async createForCourse(courseId: string, dto: CreateAttachmentDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    if (dto.sectionId) await this.ensureSectionInCourse(courseId, dto.sectionId);
    if (dto.lessonId) await this.ensureLessonInCourse(courseId, dto.lessonId);

    const extension = dto.fileName.includes('.')
      ? dto.fileName.slice(dto.fileName.lastIndexOf('.'))
      : '';
    const storageKey = `attachments/${courseId}/${randomUUID()}${extension}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        courseId,
        title: dto.title,
        storageKey,
        fileSizeBytes: dto.fileSizeBytes,
        sectionId: dto.sectionId,
        lessonId: dto.lessonId,
      },
    });

    const uploadUrl = await this.b2.getPresignedPutUrl(storageKey);
    return { attachment, uploadUrl };
  }

  async findAllForCourseAdmin(courseId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    return this.prisma.attachment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(courseId: string, attachmentId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    const attachment = await this.ensureAttachmentInCourse(courseId, attachmentId);
    await this.b2.deleteByPrefix(attachment.storageKey);
    return this.prisma.attachment.delete({ where: { id: attachmentId } });
  }

  /** رابط تحميل مؤقت للطالب (أو الزائر لو المرفق تابع لدرس معاينة مجانية). */
  async getDownloadUrl(attachmentId: string, studentId: string | null) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { course: true, lesson: true },
    });
    if (!attachment || !attachment.course.isPublished) {
      throw new NotFoundException('المرفق مش موجود');
    }

    const isFreePreview = attachment.lesson?.isFreePreview ?? false;
    if (!isFreePreview) {
      if (!studentId) throw new ForbiddenException('لازم تسجل دخول الأول');
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: attachment.courseId } },
      });
      if (enrollment?.status !== EnrollmentStatus.ACTIVE) {
        throw new ForbiddenException('لازم تكون مشترك في الكورس ده');
      }
    }

    const url = await this.b2.getPresignedGetUrl(attachment.storageKey, DOWNLOAD_TTL_SECONDS);
    return { url, expiresInSeconds: DOWNLOAD_TTL_SECONDS };
  }

  private async ensureAttachmentInCourse(courseId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.courseId !== courseId) {
      throw new NotFoundException('المرفق مش موجود');
    }
    return attachment;
  }

  private async ensureSectionInCourse(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.courseId !== courseId) {
      throw new NotFoundException('القسم مش موجود');
    }
  }

  private async ensureLessonInCourse(courseId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('الدرس مش موجود');
    }
  }
}
