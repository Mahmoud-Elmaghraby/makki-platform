import { useState } from "react";
import { Plus, Paperclip, Trash2 } from "lucide-react";
import { Button, Card, EmptyState } from "./ui";
import { AttachmentFormModal } from "./AttachmentFormModal";
import { useAttachments, useDeleteAttachment } from "../hooks/useAttachments";
import { useSections } from "../hooks/useSections";
import { useToast } from "./ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { CourseDetail } from "../types/api";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} م.ب` : `${Math.round(bytes / 1024)} ك.ب`;
}

export function CourseAttachmentsTab({ course }: { course: CourseDetail }) {
  const attachmentsQuery = useAttachments(course.id);
  const sectionsQuery = useSections(course.id);
  const deleteAttachment = useDeleteAttachment(course.id);
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const allLessons = [
    ...course.lessons,
    ...flattenSectionLessons(course.sections),
  ];

  async function handleDelete(id: string, title: string) {
    if (!confirm(`متأكد إنك عايز تمسح مرفق "${title}"؟`)) return;
    try {
      await deleteAttachment.mutateAsync(id);
      toast.success("تم حذف المرفق");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          مرفق جديد
        </Button>
      </div>

      {attachmentsQuery.data && attachmentsQuery.data.length === 0 && (
        <EmptyState
          title="لسه مفيش مرفقات"
          description="ملفات PDF أو مستندات مساعدة تقدر تضيفها للكورس أو لدرس معيّن."
        />
      )}

      {attachmentsQuery.data && attachmentsQuery.data.length > 0 && (
        <Card className="divide-y divide-(--color-silver-light)">
          {attachmentsQuery.data.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-(--color-muted)" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-(--color-navy)">
                    {attachment.title}
                  </div>
                  <div className="text-xs text-(--color-muted)">
                    {formatSize(attachment.fileSizeBytes)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(attachment.id, attachment.title)}
                className="shrink-0 rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {modalOpen && (
        <AttachmentFormModal
          open
          onClose={() => setModalOpen(false)}
          courseId={course.id}
          sections={sectionsQuery.data ?? []}
          lessons={allLessons}
        />
      )}
    </div>
  );
}

function flattenSectionLessons(sections: CourseDetail["sections"]): CourseDetail["lessons"] {
  return sections.flatMap((section) => [
    ...section.lessons,
    ...flattenSectionLessons(section.children),
  ]);
}
