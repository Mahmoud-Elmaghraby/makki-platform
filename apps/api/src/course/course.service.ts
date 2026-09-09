import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { EnrollmentStatus, Role } from '../generated/prisma/enums';
import { SectionService, SectionTreeNode } from '../section/section.service';
import { B2StorageService } from '../storage/b2-storage.service';
import { buildCoverImageUrl } from './cover-image.util';
import type { Lesson, Attachment, Exam } from '../generated/prisma/client';

// الهوية المستخرجة من التوكن (JwtStrategy) — بنمررها لكل عملية إدارية
// عشان نعرف نطبّق قاعدة "المدرب يشوف ويعدّل كورساته بس".
export interface Actor {
  role: Role;
  instructorId: string | null;
}

interface LessonProgressInfo {
  completed: boolean;
  watchedSeconds: number;
}

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sectionService: SectionService,
    private readonly b2: B2StorageService,
  ) {}

  async create(dto: CreateCourseDto, actor: Actor) {
    await this.ensureSlugAvailable(dto.slug);

    // مدرب بينشئ كورس بيتحط عليه تلقائيًا، حتى لو حاول يبعت instructorId
    // مختلف — الأدمن بس اللي يقدر يحدد مدرب تاني أو يسيبه من غير مدرب.
    const instructorId =
      actor.role === Role.INSTRUCTOR ? actor.instructorId : (dto.instructorId ?? null);

    return this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        track: dto.track,
        faculty: dto.faculty,
        academicYear: dto.academicYear,
        priceEGP: dto.priceEGP,
        instructorId,
        isPublished: dto.isPublished ?? false,
        detailedDescription: dto.detailedDescription,
        whatYouWillLearn: dto.whatYouWillLearn ?? [],
        requirements: dto.requirements ?? [],
        targetAudience: dto.targetAudience,
      },
    });
  }

  async getCoverUploadUrl(id: string, actor: Actor) {
    const course = await this.ensureExists(id);
    this.assertOwnership(course.instructorId, actor);
    const storageKey = `covers/${id}`;
    const uploadUrl = await this.b2.getPresignedPutUrl(storageKey);
    return { uploadUrl, storageKey };
  }

  async confirmCoverUpload(id: string, storageKey: string, actor: Actor) {
    const course = await this.ensureExists(id);
    this.assertOwnership(course.instructorId, actor);
    if (storageKey !== `covers/${id}`) {
      throw new ForbiddenException('مفتاح الرفع مش متطابق مع الكورس ده');
    }
    const updated = await this.prisma.course.update({
      where: { id },
      data: { coverImageKey: storageKey },
    });
    return { ...updated, coverImageUrl: buildCoverImageUrl(updated) };
  }

  async findPublished(track?: string, faculty?: string, academicYear?: string, q?: string) {
    const query = q?.trim();
    const courses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        ...(track ? { track: track as never } : {}),
        ...(faculty ? { faculty: faculty as never } : {}),
        ...(academicYear ? { academicYear: academicYear as never } : {}),
        // بحث بسيط بالعنوان/الوصف (مش حساس لحالة الأحرف) — كافي لحجم
        // الكتالوج الحالي من غير الحاجة لمحرك بحث خارجي.
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { description: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        instructor: { select: { id: true, name: true, photoUrl: true } },
        _count: { select: { lessons: { where: { isPublished: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return courses.map((c) => ({ ...c, coverImageUrl: buildCoverImageUrl(c) }));
  }

  async findAllAdmin(actor: Actor) {
    const courses = await this.prisma.course.findMany({
      where: actor.role === Role.INSTRUCTOR ? { instructorId: actor.instructorId } : {},
      include: {
        instructor: { select: { id: true, name: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map((c) => ({ ...c, coverImageUrl: buildCoverImageUrl(c) }));
  }

  async findBySlugForViewer(slug: string, studentId: string | null) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: { instructor: { select: { id: true, name: true, bio: true, photoUrl: true } } },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('الكورس مش موجود');
    }

    const isEnrolled = studentId
      ? await this.isEnrolled(studentId, course.id)
      : false;
    const tree = await this.sectionService.getTreeForCourse(course.id);
    const progressMap =
      isEnrolled && studentId
        ? await this.getProgressMap(studentId, course.id)
        : new Map<string, LessonProgressInfo>();

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      detailedDescription: course.detailedDescription,
      whatYouWillLearn: course.whatYouWillLearn,
      requirements: course.requirements,
      targetAudience: course.targetAudience,
      coverImageUrl: buildCoverImageUrl(course),
      track: course.track,
      faculty: course.faculty,
      academicYear: course.academicYear,
      priceEGP: course.priceEGP,
      instructor: course.instructor,
      isEnrolled,
      sections: this.mapSectionTreeForViewer(tree.sections, isEnrolled, progressMap),
      lessons: this.mapLessonsForViewer(tree.rootLessons, isEnrolled, progressMap),
      attachments: this.mapAttachmentsForViewer(tree.rootAttachments),
      exams: this.mapExamsForViewer(tree.rootExams),
    };
  }

  /** خريطة تقدّم الطالب في دروس الكورس ده (بيتستخدم بس لما يكون مشترك فعلاً). */
  private async getProgressMap(studentId: string, courseId: string) {
    const rows = await this.prisma.lessonProgress.findMany({
      where: { studentId, lesson: { courseId } },
      select: { lessonId: true, completed: true, watchedSeconds: true },
    });
    return new Map<string, LessonProgressInfo>(
      rows.map((r) => [r.lessonId, { completed: r.completed, watchedSeconds: r.watchedSeconds }]),
    );
  }

  async findOneAdmin(id: string, actor: Actor) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { instructor: { select: { id: true, name: true } } },
    });
    if (!course) throw new NotFoundException('الكورس مش موجود');
    this.assertOwnership(course.instructorId, actor);

    const tree = await this.sectionService.getTreeForCourse(id);

    return {
      ...course,
      coverImageUrl: buildCoverImageUrl(course),
      sections: tree.sections,
      lessons: tree.rootLessons,
      attachments: tree.rootAttachments,
      exams: tree.rootExams,
    };
  }

  private mapSectionTreeForViewer(
    nodes: SectionTreeNode[],
    isEnrolled: boolean,
    progressMap: Map<string, LessonProgressInfo>,
  ): unknown[] {
    return nodes.map((node) => ({
      id: node.id,
      title: node.title,
      order: node.order,
      children: this.mapSectionTreeForViewer(node.children, isEnrolled, progressMap),
      lessons: this.mapLessonsForViewer(node.lessons, isEnrolled, progressMap),
      attachments: this.mapAttachmentsForViewer(node.attachments),
      exams: this.mapExamsForViewer(node.exams),
    }));
  }

  private mapLessonsForViewer(
    lessons: Lesson[],
    isEnrolled: boolean,
    progressMap: Map<string, LessonProgressInfo>,
  ) {
    return lessons
      .filter((l) => l.isPublished)
      .map((l) => {
        const progress = progressMap.get(l.id);
        return {
          id: l.id,
          title: l.title,
          description: l.description,
          order: l.order,
          durationSeconds: l.durationSeconds,
          isFreePreview: l.isFreePreview,
          isLocked: !l.isFreePreview && !isEnrolled,
          completed: progress?.completed ?? false,
          watchedSeconds: progress?.watchedSeconds ?? 0,
        };
      });
  }

  private mapAttachmentsForViewer(attachments: Attachment[]) {
    return attachments.map((a) => ({
      id: a.id,
      title: a.title,
      fileSizeBytes: a.fileSizeBytes,
    }));
  }

  private mapExamsForViewer(exams: Exam[]) {
    return exams
      .filter((e) => e.isPublished)
      .map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        durationMinutes: e.durationMinutes,
      }));
  }

  async update(id: string, dto: UpdateCourseDto, actor: Actor) {
    const course = await this.ensureExists(id);
    this.assertOwnership(course.instructorId, actor);
    if (dto.slug) await this.ensureSlugAvailable(dto.slug, id);

    // مدرب مايقدرش ينقل الكورس لمدرب تاني، الأدمن بس.
    const data =
      actor.role === Role.INSTRUCTOR ? { ...dto, instructorId: undefined } : dto;

    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string, actor: Actor) {
    const course = await this.ensureExists(id);
    this.assertOwnership(course.instructorId, actor);
    return this.prisma.course.delete({ where: { id } });
  }

  /** بيستخدمها section/lesson/exam/attachment services عشان يتأكدوا إن
   * الكورس اللي بيتعدّل عليه فعلاً ملك المدرب صاحب التوكن. */
  async assertCourseOwnershipById(courseId: string, actor: Actor) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) throw new NotFoundException('الكورس مش موجود');
    this.assertOwnership(course.instructorId, actor);
  }

  private assertOwnership(courseInstructorId: string | null, actor: Actor) {
    if (actor.role === Role.INSTRUCTOR && courseInstructorId !== actor.instructorId) {
      throw new ForbiddenException('الكورس ده مش ملكك');
    }
  }

  private async isEnrolled(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    return enrollment?.status === EnrollmentStatus.ACTIVE;
  }

  private async ensureExists(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('الكورس مش موجود');
    return course;
  }

  private async ensureSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('الرابط ده مستخدم لكورس تاني');
    }
  }
}
