/**
 * رابط صورة غلاف الكورس العام (عن طريق MediaController) من مفتاح B2
 * المخزّن. مشترك بين CourseService و EnrollmentService (اللي بيرجّع
 * coverImageUrl كمان في "كورساتي") عشان الحساب يفضل متطابق في كل مكان.
 * الـ ?v= بتاعة updatedAt بتضمن إن الكاش (سنة كاملة، immutable) ميفضلش
 * شايل نسخة قديمة بعد ما الأدمن يغيّر الصورة.
 */
export function buildCoverImageUrl(course: {
  coverImageKey: string | null;
  updatedAt: Date;
}): string | null {
  if (!course.coverImageKey) return null;
  const apiBase = process.env.API_PUBLIC_URL;
  const encoded = Buffer.from(course.coverImageKey).toString('base64url');
  return `${apiBase}/media/${encoded}?v=${course.updatedAt.getTime()}`;
}
