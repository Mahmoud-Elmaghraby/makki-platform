import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseOwnershipService, Actor } from '../course/course-ownership.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import type { Lesson, Attachment, Exam } from '../generated/prisma/client';

export interface SectionTreeNode {
  id: string;
  title: string;
  order: number;
  children: SectionTreeNode[];
  lessons: Lesson[];
  attachments: Attachment[];
  exams: Exam[];
}

export interface CourseTree {
  sections: SectionTreeNode[];
  rootLessons: Lesson[];
  rootAttachments: Attachment[];
  rootExams: Exam[];
}

@Injectable()
export class SectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: CourseOwnershipService,
  ) {}

  async create(courseId: string, dto: CreateSectionDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    if (dto.parentId) await this.ensureSectionInCourse(courseId, dto.parentId);

    return this.prisma.section.create({
      data: {
        courseId,
        title: dto.title,
        parentId: dto.parentId,
        order: dto.order ?? 0,
      },
    });
  }

  async findAllForCourseAdmin(courseId: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    return this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  async update(courseId: string, id: string, dto: UpdateSectionDto, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureSectionInCourse(courseId, id);

    if (dto.parentId) {
      await this.ensureSectionInCourse(courseId, dto.parentId);
      if (await this.wouldCreateCycle(id, dto.parentId)) {
        throw new BadRequestException(
          'مينفعش القسم يبقى تحت نفسه أو تحت قسم فرعي منه',
        );
      }
    }

    return this.prisma.section.update({ where: { id }, data: dto });
  }

  async remove(courseId: string, id: string, actor: Actor) {
    await this.ownership.assertCourseOwnership(courseId, actor);
    await this.ensureSectionInCourse(courseId, id);
    return this.prisma.section.delete({ where: { id } });
  }

  async getTreeForCourse(courseId: string): Promise<CourseTree> {
    const [sections, lessons, attachments, exams] = await Promise.all([
      this.prisma.section.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.lesson.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.attachment.findMany({ where: { courseId } }),
      this.prisma.exam.findMany({ where: { courseId } }),
    ]);

    const nodeById = new Map<string, SectionTreeNode>();
    for (const s of sections) {
      nodeById.set(s.id, {
        id: s.id,
        title: s.title,
        order: s.order,
        children: [],
        lessons: [],
        attachments: [],
        exams: [],
      });
    }

    const roots: SectionTreeNode[] = [];
    for (const s of sections) {
      const node = nodeById.get(s.id)!;
      const parent = s.parentId ? nodeById.get(s.parentId) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }

    const rootLessons: Lesson[] = [];
    for (const lesson of lessons) {
      const node = lesson.sectionId
        ? nodeById.get(lesson.sectionId)
        : undefined;
      if (node) node.lessons.push(lesson);
      else rootLessons.push(lesson);
    }

    const rootAttachments: Attachment[] = [];
    for (const attachment of attachments) {
      const node = attachment.sectionId
        ? nodeById.get(attachment.sectionId)
        : undefined;
      if (node) node.attachments.push(attachment);
      else rootAttachments.push(attachment);
    }

    const rootExams: Exam[] = [];
    for (const exam of exams) {
      const node = exam.sectionId ? nodeById.get(exam.sectionId) : undefined;
      if (node) node.exams.push(exam);
      else rootExams.push(exam);
    }

    this.sortTree(roots);

    return { sections: roots, rootLessons, rootAttachments, rootExams };
  }

  private sortTree(nodes: SectionTreeNode[]) {
    nodes.sort((a, b) => a.order - b.order);
    for (const node of nodes) this.sortTree(node.children);
  }

  // Walks up from `proposedParentId` toward the root; if it ever reaches
  // `sectionId`, reparenting would create a cycle in the tree.
  private async wouldCreateCycle(
    sectionId: string,
    proposedParentId: string,
  ): Promise<boolean> {
    let currentId: string | null = proposedParentId;
    while (currentId) {
      if (currentId === sectionId) return true;
      const current: { parentId: string | null } | null =
        await this.prisma.section.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });
      currentId = current?.parentId ?? null;
    }
    return false;
  }

  async ensureSectionInCourse(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.courseId !== courseId) {
      throw new NotFoundException('القسم مش موجود');
    }
    return section;
  }
}
