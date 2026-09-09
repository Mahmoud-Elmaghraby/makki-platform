// تصنيف "قسم كورسات الكليات" — كل كورس طلاب (STUDENT_COURSE) بيتبع كلية
// وفرقة واحدة بالظبط (راجع Course.faculty/Course.academicYear في الـ
// Prisma schema). مستخدم في لوحة الأدمن (فورم إنشاء/تعديل الكورس) وفي
// صفحة "كورساتنا" العامة مع بعض، عشان الليبل والترتيب يفضلوا متطابقين.

export type Faculty = "LAW_TANTA" | "LAW_ALEXANDRIA" | "LAW_PHAROS" | "SHARIA_AND_LAW";
export type AcademicYear = "YEAR_1" | "YEAR_2" | "YEAR_3" | "YEAR_4";

export const FACULTIES: Faculty[] = ["LAW_TANTA", "LAW_ALEXANDRIA", "LAW_PHAROS", "SHARIA_AND_LAW"];

export const ACADEMIC_YEARS: AcademicYear[] = ["YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4"];

export const FACULTY_LABELS: Record<Faculty, string> = {
  LAW_TANTA: "حقوق طنطا",
  LAW_ALEXANDRIA: "حقوق إسكندرية",
  LAW_PHAROS: "حقوق فاروس",
  SHARIA_AND_LAW: "شريعة وقانون",
};

export const ACADEMIC_YEAR_LABELS: Record<AcademicYear, string> = {
  YEAR_1: "الفرقة الأولى",
  YEAR_2: "الفرقة الثانية",
  YEAR_3: "الفرقة الثالثة",
  YEAR_4: "الفرقة الرابعة",
};
