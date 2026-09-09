import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../student/lib/apiClient";
import type { CourseTrack } from "../student/types/api";
import type { Faculty, AcademicYear } from "../lib/academicTaxonomy";

// كتالوج الكورسات/الدورات العام — GET /courses?track=... (بدون تسجيل دخول،
// راجع course.controller.ts / course.service.ts::findPublished في الباك إند).
// نفس الـ apiClient بتاع بوابة الطالب: لو الزائر مسجّل دخول كطالب أصلاً
// (توكن موجود في localStorage) هيتبعت مع الطلب عادي وده مش هيأثر على الرد
// هنا لإن findPublished مش بيفرّق حسب الهوية، بس مفيد لطلبات تانية بعدين.
export interface PublicCourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  track: CourseTrack;
  faculty: Faculty | null;
  academicYear: AcademicYear | null;
  priceEGP: number;
  instructor: { id: string; name: string; photoUrl: string | null } | null;
  _count: { lessons: number };
}

export function usePublicCourses(
  track: CourseTrack,
  filters?: { faculty?: Faculty; academicYear?: AcademicYear; q?: string },
) {
  const q = filters?.q?.trim() || undefined;
  return useQuery({
    queryKey: ["public", "courses", track, filters?.faculty, filters?.academicYear, q],
    queryFn: async () => {
      const { data } = await apiClient.get<PublicCourseSummary[]>("/courses", {
        params: { track, faculty: filters?.faculty, academicYear: filters?.academicYear, q },
      });
      return data;
    },
    staleTime: 60_000,
  });
}
