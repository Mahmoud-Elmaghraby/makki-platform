import { useState, type FormEvent } from "react";
import { Modal, Field, Input, Textarea, Select, Button, ErrorBanner } from "./ui";
import { useInstructors } from "../hooks/useInstructors";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Course, CourseTrack, Faculty, AcademicYear } from "../types/api";
import { FACULTIES, ACADEMIC_YEARS, FACULTY_LABELS, ACADEMIC_YEAR_LABELS } from "../../lib/academicTaxonomy";
import type { CourseInput } from "../hooks/useCourses";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// كل سطر بند مستقل — أبسط UX من قايمة ديناميكية، وكفاية لعدد بنود صغير
// زي "هتتعلم إيه" و"المتطلبات".
function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CourseFormModal({
  open,
  onClose,
  track,
  course,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  track: CourseTrack;
  course?: Course;
  onSubmit: (input: CourseInput) => Promise<unknown>;
  submitting: boolean;
}) {
  const { user } = useAdminAuth();
  const instructorsQuery = useInstructors();
  const isEdit = !!course;

  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(course?.description ?? "");
  const [detailedDescription, setDetailedDescription] = useState(
    course?.detailedDescription ?? "",
  );
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(
    (course?.whatYouWillLearn ?? []).join("\n"),
  );
  const [requirements, setRequirements] = useState((course?.requirements ?? []).join("\n"));
  const [targetAudience, setTargetAudience] = useState(course?.targetAudience ?? "");
  const [faculty, setFaculty] = useState<Faculty | "">(course?.faculty ?? "");
  const [academicYear, setAcademicYear] = useState<AcademicYear | "">(course?.academicYear ?? "");
  const [priceEGP, setPriceEGP] = useState(course?.priceEGP?.toString() ?? "");
  const [instructorId, setInstructorId] = useState(course?.instructorId ?? "");
  const [isPublished, setIsPublished] = useState(course?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title,
        slug,
        description: description || undefined,
        detailedDescription: detailedDescription || undefined,
        whatYouWillLearn: splitLines(whatYouWillLearn),
        requirements: splitLines(requirements),
        targetAudience: targetAudience || undefined,
        track,
        faculty: track === "STUDENT_COURSE" ? faculty || undefined : undefined,
        academicYear: track === "STUDENT_COURSE" ? academicYear || undefined : undefined,
        priceEGP: Number(priceEGP) || 0,
        instructorId:
          user?.role === "ADMIN" ? instructorId || undefined : undefined,
        isPublished,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل بيانات الكورس" : track === "STUDENT_COURSE" ? "إضافة كورس جديد" : "إضافة دورة جديدة"}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="العنوان">
          <Input
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="مثال: مقدمة في القانون المدني"
          />
        </Field>

        <Field
          label="الرابط (slug)"
          hint="بيتولّد تلقائيًا من العنوان، وممكن تعدّله يدوي"
        >
          <Input
            required
            dir="ltr"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="intro-civil-law"
          />
        </Field>

        <Field label="الوصف">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {!isEdit && (
          <p className="rounded-md bg-(--color-paper-alt) px-3 py-2 text-xs text-(--color-muted)">
            هترفع صورة الغلاف بعد ما تحفظ الكورس، من صفحة تفاصيله مباشرة.
          </p>
        )}

        <Field label="الوصف التفصيلي" hint="بيظهر في صفحة الكورس العامة تحت الوصف المختصر — نص تسويقي كامل يشرح الكورس ويشد الطالب">
          <Textarea
            rows={4}
            value={detailedDescription}
            onChange={(e) => setDetailedDescription(e.target.value)}
            placeholder="مثال: كورس شامل يؤهلك لفهم أساسيات القانون الجنائي من الصفر، بأسلوب مبسّط وأمثلة عملية من الواقع العملي..."
          />
        </Field>

        <Field label="هيتعلم إيه؟" hint="سطر لكل نقطة">
          <Textarea
            rows={3}
            value={whatYouWillLearn}
            onChange={(e) => setWhatYouWillLearn(e.target.value)}
            placeholder={"فهم أركان الجريمة\nالتمييز بين الجنايات والجنح\nتحليل نصوص قانون العقوبات"}
          />
        </Field>

        <Field label="المتطلبات" hint="سطر لكل نقطة، اختياري">
          <Textarea
            rows={2}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder={"مفيش متطلبات مسبقة"}
          />
        </Field>

        <Field label="لمين الكورس ده؟" hint="اختياري">
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="مثال: طلاب الفرقة الأولى حقوق المهتمين بالقانون الجنائي"
          />
        </Field>

        {track === "STUDENT_COURSE" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="الكلية" hint="اختياري لحد ما تتحدد">
              <Select value={faculty} onChange={(e) => setFaculty(e.target.value as Faculty | "")}>
                <option value="">بدون تحديد</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {FACULTY_LABELS[f]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الفرقة" hint="اختياري لحد ما تتحدد">
              <Select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value as AcademicYear | "")}
              >
                <option value="">بدون تحديد</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {ACADEMIC_YEAR_LABELS[y]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="السعر (جنيه)">
            <Input
              type="number"
              min={0}
              required
              value={priceEGP}
              onChange={(e) => setPriceEGP(e.target.value)}
            />
          </Field>

          {user?.role === "ADMIN" && (
            <Field label="المدرب" hint="اختياري">
              <Select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                <option value="">بدون مدرب محدد</option>
                {instructorsQuery.data?.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-(--color-navy)">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-(--color-silver) text-(--color-navy)"
          />
          منشور وظاهر للطلاب
        </label>

        {error && <ErrorBanner message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? "حفظ التعديلات" : "إنشاء"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
