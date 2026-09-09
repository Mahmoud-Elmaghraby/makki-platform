import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ChevronDown, ChevronLeft, FileVideo, Lock, HelpCircle } from "lucide-react";
import { Badge } from "./ui";
import { VideoUploadControl } from "./VideoUploadControl";
import { useDeleteLesson } from "../hooks/useLessons";
import { useDeleteSection } from "../hooks/useSections";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Lesson, SectionTreeNode } from "../types/api";

// نسخة خفيفة من Section — العقدة جاية من شجرة GET /courses/admin/:id، اللي
// مش راجع فيها courseId لكل عقدة (بديهي، هو نفسه courseId الكورس الحالي).
export interface EditableSection {
  id: string;
  title: string;
  order: number;
  parentId: string | null;
}

export function LessonRow({
  courseId,
  lesson,
  onEdit,
}: {
  courseId: string;
  lesson: Lesson;
  onEdit: () => void;
}) {
  const toast = useToast();
  const deleteLesson = useDeleteLesson(courseId);

  async function handleDelete() {
    if (!confirm(`متأكد إنك عايز تمسح درس "${lesson.title}"؟`)) return;
    try {
      await deleteLesson.mutateAsync(lesson.id);
      toast.success("تم حذف الدرس");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-silver-light) bg-white px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <FileVideo className="h-4 w-4 shrink-0 text-(--color-muted)" />
        <span className="truncate text-sm font-medium text-(--color-navy)">{lesson.title}</span>
        {lesson.isFreePreview && <Badge tone="gold">معاينة مجانية</Badge>}
        {!lesson.isPublished && <Badge tone="neutral">مسودة</Badge>}
        {!lesson.isFreePreview && !lesson.videoReady && (
          <Lock className="h-3.5 w-3.5 text-(--color-muted)" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <VideoUploadControl
          courseId={courseId}
          lessonId={lesson.id}
          videoReady={lesson.videoReady}
          videoFailed={lesson.videoFailed}
        />
        <Link
          to={`/admin/courses/${courseId}/lessons/${lesson.id}/checkpoints`}
          title="أسئلة داخل الفيديو"
          className="rounded-lg p-1.5 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg p-1.5 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SectionNode({
  courseId,
  node,
  depth = 0,
  parentId = null,
  onAddSubsection,
  onEditSection,
  onAddLesson,
  onEditLesson,
}: {
  courseId: string;
  node: SectionTreeNode;
  depth?: number;
  parentId?: string | null;
  onAddSubsection: (parent: SectionTreeNode) => void;
  onEditSection: (section: EditableSection) => void;
  onAddLesson: (sectionId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const toast = useToast();
  const deleteSection = useDeleteSection(courseId);

  async function handleDeleteSection() {
    if (
      !confirm(
        `متأكد إنك عايز تمسح قسم "${node.title}"؟ الدروس جواه لازم تتنقل أو تتمسح الأول.`,
      )
    )
      return;
    try {
      await deleteSection.mutateAsync(node.id);
      toast.success("تم حذف القسم");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div style={{ marginInlineStart: depth > 0 ? "1.5rem" : 0 }} className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-(--color-navy)/5 px-3 py-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-semibold text-(--color-navy)"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {node.title}
          <span className="text-xs font-normal text-(--color-muted)">
            ({node.lessons.length} درس)
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddLesson(node.id)}
            title="إضافة درس"
            className="rounded-lg p-1.5 text-(--color-muted) hover:bg-white hover:text-(--color-navy)"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onAddSubsection(node)}
            title="إضافة قسم فرعي"
            className="rounded-lg px-1.5 py-1 text-[10px] font-medium text-(--color-muted) hover:bg-white hover:text-(--color-navy)"
          >
            + قسم فرعي
          </button>
          <button
            onClick={() =>
              onEditSection({ id: node.id, title: node.title, order: node.order, parentId })
            }
            title="تعديل القسم"
            className="rounded-lg p-1.5 text-(--color-muted) hover:bg-white hover:text-(--color-navy)"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDeleteSection}
            title="حذف القسم"
            className="rounded-lg p-1.5 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {node.lessons
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((lesson) => (
              <LessonRow
                key={lesson.id}
                courseId={courseId}
                lesson={lesson}
                onEdit={() => onEditLesson(lesson)}
              />
            ))}

          {node.children
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((child) => (
              <SectionNode
                key={child.id}
                courseId={courseId}
                node={child}
                depth={depth + 1}
                parentId={node.id}
                onAddSubsection={onAddSubsection}
                onEditSection={onEditSection}
                onAddLesson={onAddLesson}
                onEditLesson={onEditLesson}
              />
            ))}
        </div>
      )}
    </div>
  );
}
