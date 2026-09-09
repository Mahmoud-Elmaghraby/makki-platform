import { useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { Button, Card, EmptyState } from "./ui";
import { SectionNode, LessonRow, type EditableSection } from "./SectionNode";
import { LessonFormModal } from "./LessonFormModal";
import { SectionFormModal } from "./SectionFormModal";
import { useSections } from "../hooks/useSections";
import type { CourseDetail, Lesson, SectionTreeNode } from "../types/api";

export function CourseContentTab({ course }: { course: CourseDetail }) {
  const sectionsQuery = useSections(course.id);

  const [sectionModal, setSectionModal] = useState<{
    section?: EditableSection;
    parentId?: string;
  } | null>(null);
  const [lessonModal, setLessonModal] = useState<{
    lesson?: Lesson;
    sectionId?: string;
  } | null>(null);

  const sections = (course.sections ?? []).slice().sort((a, b) => a.order - b.order);
  const rootLessons = (course.lessons ?? []).slice().sort((a, b) => a.order - b.order);

  const hasContent = sections.length > 0 || rootLessons.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setLessonModal({})}>
          <Plus className="h-4 w-4" />
          درس بدون قسم
        </Button>
        <Button size="sm" onClick={() => setSectionModal({})}>
          <FolderPlus className="h-4 w-4" />
          قسم جديد
        </Button>
      </div>

      {!hasContent && (
        <EmptyState
          title="لسه مفيش محتوى في الكورس ده"
          description="ابدأ بإضافة قسم (زي: الوحدة الأولى) وبعدين ضيف دروسه، أو ضيف درس مباشرة من غير قسم."
        />
      )}

      {rootLessons.length > 0 && (
        <Card className="space-y-2 p-3">
          <div className="px-1 text-xs font-medium text-(--color-muted)">دروس بدون قسم</div>
          {rootLessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              courseId={course.id}
              lesson={lesson}
              onEdit={() => setLessonModal({ lesson })}
            />
          ))}
        </Card>
      )}

      {sections.length > 0 && (
        <Card className="space-y-3 p-3">
          {sections.map((node: SectionTreeNode) => (
            <SectionNode
              key={node.id}
              courseId={course.id}
              node={node}
              onAddSubsection={(parent) => setSectionModal({ parentId: parent.id })}
              onEditSection={(section) => setSectionModal({ section })}
              onAddLesson={(sectionId) => setLessonModal({ sectionId })}
              onEditLesson={(lesson) => setLessonModal({ lesson })}
            />
          ))}
        </Card>
      )}

      {sectionModal && (
        <SectionFormModal
          open
          onClose={() => setSectionModal(null)}
          courseId={course.id}
          section={sectionModal.section}
          parentId={sectionModal.parentId}
          allSections={sectionsQuery.data ?? []}
        />
      )}

      {lessonModal && (
        <LessonFormModal
          open
          onClose={() => setLessonModal(null)}
          courseId={course.id}
          lesson={lessonModal.lesson}
          sectionId={lessonModal.sectionId}
        />
      )}
    </div>
  );
}
