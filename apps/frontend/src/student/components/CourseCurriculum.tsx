import { Link } from "react-router-dom";
import clsx from "clsx";
import { CheckCircle2, Lock, PlayCircle, FileText, ClipboardList, ChevronDown } from "lucide-react";
import { useState } from "react";
import type {
  StudentAttachment,
  StudentExamSummary,
  StudentLesson,
  StudentSectionNode,
} from "../types/api";

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes} د`;
}

function LessonItem({
  lesson,
  isActive,
  onSelect,
}: {
  lesson: StudentLesson;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={lesson.isLocked}
      className={clsx(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right text-sm transition",
        isActive ? "bg-(--color-navy) text-(--color-gold)" : "hover:bg-(--color-paper-alt)",
        lesson.isLocked && "cursor-not-allowed opacity-50",
      )}
    >
      {lesson.isLocked ? (
        <Lock className="h-4 w-4 shrink-0" />
      ) : lesson.completed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <PlayCircle className={clsx("h-4 w-4 shrink-0", isActive ? "text-(--color-gold)" : "text-(--color-muted)")} />
      )}
      <span className="flex-1 truncate">{lesson.title}</span>
      {formatDuration(lesson.durationSeconds) && (
        <span className={clsx("shrink-0 text-xs", isActive ? "text-(--color-gold)/70" : "text-(--color-muted)")}>
          {formatDuration(lesson.durationSeconds)}
        </span>
      )}
    </button>
  );
}

function AttachmentItem({ attachment, onOpen }: { attachment: StudentAttachment; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right text-sm text-(--color-muted) transition hover:bg-(--color-paper-alt)"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{attachment.title}</span>
    </button>
  );
}

function ExamItem({ exam }: { exam: StudentExamSummary }) {
  return (
    <Link
      to={`/student/exams/${exam.id}/take`}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right text-sm text-(--color-gold-dim) transition hover:bg-(--color-paper-alt)"
    >
      <ClipboardList className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{exam.title}</span>
    </Link>
  );
}

function SectionBlock({
  section,
  activeLessonId,
  onSelectLesson,
  onOpenAttachment,
}: {
  section: StudentSectionNode;
  activeLessonId: string | null;
  onSelectLesson: (lesson: StudentLesson) => void;
  onOpenAttachment: (attachment: StudentAttachment) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasContent =
    section.lessons.length > 0 ||
    section.attachments.length > 0 ||
    section.exams.length > 0 ||
    section.children.length > 0;

  if (!hasContent) return null;

  return (
    <div className="rounded-xl border border-(--color-silver-light) bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-(--color-navy)"
      >
        <span>{section.title}</span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 transition-transform", !open && "-rotate-90")} />
      </button>

      {open && (
        <div className="space-y-0.5 border-t border-(--color-silver-light) p-1.5">
          {section.lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              isActive={lesson.id === activeLessonId}
              onSelect={() => onSelectLesson(lesson)}
            />
          ))}
          {section.attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onOpen={() => onOpenAttachment(attachment)}
            />
          ))}
          {section.exams.map((exam) => (
            <ExamItem key={exam.id} exam={exam} />
          ))}
          {section.children.map((child) => (
            <div key={child.id} className="pr-2 pt-1">
              <SectionBlock
                section={child}
                activeLessonId={activeLessonId}
                onSelectLesson={onSelectLesson}
                onOpenAttachment={onOpenAttachment}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CourseCurriculum({
  sections,
  rootLessons,
  rootAttachments,
  rootExams,
  activeLessonId,
  onSelectLesson,
  onOpenAttachment,
}: {
  sections: StudentSectionNode[];
  rootLessons: StudentLesson[];
  rootAttachments: StudentAttachment[];
  rootExams: StudentExamSummary[];
  activeLessonId: string | null;
  onSelectLesson: (lesson: StudentLesson) => void;
  onOpenAttachment: (attachment: StudentAttachment) => void;
}) {
  return (
    <div className="space-y-2">
      {(rootLessons.length > 0 || rootAttachments.length > 0 || rootExams.length > 0) && (
        <div className="space-y-0.5 rounded-xl border border-(--color-silver-light) bg-white p-1.5">
          {rootLessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              isActive={lesson.id === activeLessonId}
              onSelect={() => onSelectLesson(lesson)}
            />
          ))}
          {rootAttachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onOpen={() => onOpenAttachment(attachment)}
            />
          ))}
          {rootExams.map((exam) => (
            <ExamItem key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          activeLessonId={activeLessonId}
          onSelectLesson={onSelectLesson}
          onOpenAttachment={onOpenAttachment}
        />
      ))}
    </div>
  );
}
