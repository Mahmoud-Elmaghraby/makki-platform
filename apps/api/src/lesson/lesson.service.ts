import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { B2StorageService } from '../storage/b2-storage.service';
import { TranscodeQueueService } from '../transcode/transcode-queue.service';
import { CourseOwnershipService, Actor } from '../course/course-ownership.service';
import {
  HlsTokenService,
  PLAYBACK_SESSION_TTL_SECONDS,
} from './hls-token.service';
import {
  rewriteMasterManifest,
  rewriteVariantManifest,
} from './hls-manifest.util';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentStatus } from '../generated/prisma/enums';
import { CertificateService } from '../certificate/certificate.service';

const COMPLETION_THRESHOLD_RATIO = 0.9;

const VARIANT_NAME_PATTERN = /^[a-zA-Z0-9]+$/;

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly b2: B2StorageService,
    private readonly transcodeQueue: TranscodeQueueService,
    private readonly hlsTokenService: HlsTokenService,
    private readonly ownership: CourseOwnershipService,
    private readonly certificateService: CertificateService,
  ) {}

  async createForCourse(courseId: string, dto: CreateLessonDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    if (dto.sectionId) await this.ensureSectionInCourse(courseId, dto.sectionId);

    const lesson = await this.prisma.lesson.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        order: dto.order ?? 0,
        isFreePreview: dto.isFreePreview ?? false,
        isPublished: dto.isPublished ?? false,
        sectionId: dto.sectionId,
      },
    });

    const storageKey = `lessons/${lesson.id}/source`;
    const { url, fields } = await this.b2.getPresignedPostPolicy(storageKey);
    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: { storageKey },
    });

    return { lesson: { ...lesson, storageKey }, uploadUrl: url, uploadFields: fields };
  }

  /**
   * رابط رفع جديد لنفس مفتاح التخزين (storageKey) بتاع الدرس — للحالات اللي
   * الأدمن بيرفع الفيديو بعد إنشاء الدرس بفترة، أو بيعيد المحاولة بعد فشل
   * الرفع الأول. الرابط اللي اترجع وقت createForCourse بيصلاحيته ساعة بس.
   */
  async getUploadUrl(courseId: string, lessonId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    const lesson = await this.ensureLessonInCourse(courseId, lessonId);
    if (!lesson.storageKey) {
      throw new NotFoundException('الدرس ده لسه معملوش تجهيز لرفع فيديو');
    }
    const { url, fields } = await this.b2.getPresignedPostPolicy(lesson.storageKey);
    return { uploadUrl: url, uploadFields: fields };
  }

  async confirmUpload(courseId: string, lessonId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    const lesson = await this.ensureLessonInCourse(courseId, lessonId);
    if (!lesson.storageKey) {
      throw new NotFoundException('الدرس ده لسه معملوش رفع فيديو');
    }

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoReady: false, videoFailed: false },
    });

    await this.transcodeQueue.enqueue({
      lessonId,
      sourceKey: lesson.storageKey,
    });
    return { queued: true };
  }

  async findAllForCourseAdmin(courseId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  async updateMeta(courseId: string, lessonId: string, dto: UpdateLessonDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureLessonInCourse(courseId, lessonId);
    if (dto.sectionId) await this.ensureSectionInCourse(courseId, dto.sectionId);
    return this.prisma.lesson.update({ where: { id: lessonId }, data: dto });
  }

  async remove(courseId: string, lessonId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureLessonInCourse(courseId, lessonId);
    await this.b2.deleteByPrefix(`lessons/${lessonId}/`);
    return this.prisma.lesson.delete({ where: { id: lessonId } });
  }

  async getStatus(courseId: string, lessonId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    const lesson = await this.ensureLessonInCourse(courseId, lessonId);
    return {
      ready: lesson.videoReady,
      failed: lesson.videoFailed,
      durationSeconds: lesson.durationSeconds ?? undefined,
    };
  }

  /**
   * بتتأكد إن الطالب (أو الزائر لو الدرس معاينة مجانية) يقدر يشوف الدرس ده،
   * وترجّع الدرس نفسه. اتحطت لوحدها (بدل ما تفضل جوه getPlaybackToken بس)
   * عشان موديول checkpoint.module.ts يقدر يستخدمها كمان قبل ما يورّي أسئلة
   * الفيديو للطالب — من غير ما يكرر منطق التحقق من الاشتراك.
   */
  async assertViewerAccess(lessonId: string, studentId: string | null) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson || !lesson.isPublished || !lesson.course.isPublished) {
      throw new NotFoundException('الدرس مش موجود');
    }

    if (!lesson.isFreePreview) {
      if (!studentId) {
        throw new UnauthorizedException('لازم تسجل دخول الأول');
      }
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId: lesson.courseId } },
      });
      if (enrollment?.status !== EnrollmentStatus.ACTIVE) {
        throw new ForbiddenException('لازم تكون مشترك في الكورس ده');
      }
    }

    return lesson;
  }

  async getPlaybackToken(lessonId: string, studentId: string | null) {
    const lesson = await this.assertViewerAccess(lessonId, studentId);

    if (!lesson.videoReady) {
      throw new NotFoundException('الفيديو لسه مش جاهز');
    }

    const token = await this.hlsTokenService.sign(lesson.id);
    const apiBase = process.env.API_PUBLIC_URL;

    return {
      manifestUrl: `${apiBase}/lessons/${lesson.id}/hls/master.m3u8?token=${token}`,
      expiresAt: new Date(Date.now() + PLAYBACK_SESSION_TTL_SECONDS * 1000),
    };
  }

  async getMasterManifest(lessonId: string, token: string) {
    await this.ensureVideoReady(lessonId);
    const text = await this.b2.getObjectText(
      `lessons/${lessonId}/hls/master.m3u8`,
    );
    const apiBase = process.env.API_PUBLIC_URL;

    return rewriteMasterManifest(text, (variantLine) => {
      const variant = variantLine.split('/')[0];
      return `${apiBase}/lessons/${lessonId}/hls/${variant}/playlist.m3u8?token=${token}`;
    });
  }

  async getVariantManifest(lessonId: string, variant: string) {
    if (!VARIANT_NAME_PATTERN.test(variant)) {
      throw new NotFoundException('الجودة دي مش موجودة');
    }

    await this.ensureVideoReady(lessonId);
    const text = await this.b2.getObjectText(
      `lessons/${lessonId}/hls/${variant}/index.m3u8`,
    );

    return rewriteVariantManifest(text, (segmentLine) =>
      this.b2.getPresignedGetUrl(
        `lessons/${lessonId}/hls/${variant}/${segmentLine}`,
        PLAYBACK_SESSION_TTL_SECONDS,
      ),
    );
  }

  async updateProgress(
    studentId: string,
    lessonId: string,
    dto: UpdateProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('الدرس مش موجود');

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId, lessonId } },
    });

    const watchedSeconds = Math.max(
      existing?.watchedSeconds ?? 0,
      dto.positionSeconds,
    );
    const completed = lesson.durationSeconds
      ? watchedSeconds >= lesson.durationSeconds * COMPLETION_THRESHOLD_RATIO
      : false;

    const progress = await this.prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      update: { watchedSeconds, completed },
      create: { studentId, lessonId, watchedSeconds, completed },
    });

    // لو الدرس ده هو آخر حاجة ناقصة الطالب عشان يكمّل الكورس، بنحاول نصدر
    // الشهادة فورًا بدل ما نستنى الطالب يدخل صفحة تانية. لو الشروط مش
    // مكتملة (لسه فيه امتحانات أو دروس) الميثود بترجع من غير ما تعمل حاجة.
    if (completed && !existing?.completed) {
      await this.certificateService.tryIssueForCourse(studentId, lesson.courseId);
    }

    return progress;
  }

  private async ensureVideoReady(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || !lesson.videoReady) {
      throw new NotFoundException('الفيديو مش جاهز');
    }
    return lesson;
  }

  /** عامة عمدًا (مش private) — checkpoint.module.ts بيستخدمها كمان للتحقق الإداري. */
  async ensureLessonInCourse(courseId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('الدرس مش موجود');
    }
    return lesson;
  }

  private async ensureSectionInCourse(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.courseId !== courseId) {
      throw new NotFoundException('القسم مش موجود');
    }
  }
}
