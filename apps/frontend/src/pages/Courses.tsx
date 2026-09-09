import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GraduationCap, Building2, CheckCircle2 } from "lucide-react";
import { CourseCatalogGrid } from "../components/CourseCatalogGrid";
import { CourseSearchBox } from "../components/CourseSearchBox";
import {
  FACULTIES,
  ACADEMIC_YEARS,
  FACULTY_LABELS,
  ACADEMIC_YEAR_LABELS,
  type Faculty,
  type AcademicYear,
} from "../lib/academicTaxonomy";

type Section = "faculties" | "postgraduate";

function isFaculty(v: string | null): v is Faculty {
  return !!v && (FACULTIES as string[]).includes(v);
}

function isAcademicYear(v: string | null): v is AcademicYear {
  return !!v && (ACADEMIC_YEARS as string[]).includes(v);
}

/**
 * "كورساتنا" — صفحة مستقلة بالكامل مخصصة لكورسات طلبة كليات الحقوق
 * (STUDENT_COURSE) بس. منفصلة تمامًا عن "دوراتنا التدريبية" (Trainings.tsx)
 * اللي بتستهدف المحامين الممارسين — مقصودة كصفحتين لجمهورين مختلفين، مش
 * قسمين في صفحة واحدة.
 *
 * جوّاها تقسيم تدريجي (progressive disclosure) بين قسمين: "كورسات الكليات"
 * (طنطا/إسكندرية/فاروس/شريعة وقانون × 4 فرق) و"الدراسات العليا" (لسه
 * تصنيفها الداخلي ما اتحددش مع الدكتور، فبتظهر بعلامة "قريبًا" بس). الحالة
 * (القسم/الكلية/الفرقة) متخزّنة في الـ URL (search params) عشان تبقى قابلة
 * للمشاركة والرجوع بزرار المتصفح، بدل ما تضيع لو الطالب عمل refresh.
 *
 * بحث "زي كورسيرا": صندوق بحث عام فوق — لو الطالب كتب فيه حاجة، بنتخطى
 * التقسيم التدريجي كله وبنعرض نتائج مسطّحة من كل كورسات "كورساتنا" (بدون
 * تقييد بكلية/فرقة)، لإن قصد الطالب هنا إنه يلاقي كورس بعينه بسرعة مش يتصفح
 * التصنيف خطوة خطوة.
 */
export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");

  const section: Section = params.get("section") === "postgraduate" ? "postgraduate" : "faculties";
  const facultyParam = params.get("faculty");
  const yearParam = params.get("year");
  const faculty = isFaculty(facultyParam) ? facultyParam : null;
  const academicYear = isAcademicYear(yearParam) ? yearParam : null;

  function selectSection(next: Section) {
    setParams(next === "faculties" ? {} : { section: next });
  }
  function selectFaculty(f: Faculty) {
    setParams({ faculty: f });
  }
  function selectYear(y: AcademicYear) {
    if (!faculty) return;
    setParams({ faculty, year: y });
  }
  function resetFaculty() {
    setParams({});
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-(--color-navy) px-6 py-20 text-center">
        <div className="mb-3 text-sm font-bold text-(--color-gold)">أكاديمية مكي</div>
        <h1 className="text-3xl font-extrabold text-white md:text-4xl">كورساتنا</h1>
        <p className="mx-auto mt-5 max-w-xl leading-8 text-white/70">
          كورسات متخصصة لطلبة كليات الحقوق، بتطبيق عملي على القضايا الحقيقية ومهارات
          سوق العمل الفعلية، مش مجرد مذاكرة نظرية.
        </p>
      </section>

      {/* بحث عام — بيدوّر بالعنوان/الوصف في كل كورسات "كورساتنا" من غير ما
          يتقيّد بالكلية/الفرقة المختارة، زي أي محرك بحث كورسات عادي. */}
      <section className="border-b border-(--color-silver) px-6 py-8">
        <CourseSearchBox value={q} onChange={setQ} />
      </section>

      {q ? (
        <section className="px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <CourseCatalogGrid track="STUDENT_COURSE" q={q} />
          </div>
        </section>
      ) : (
        <>
          {/* اختيار القسم: كورسات الكليات / الدراسات العليا */}
          <section className="border-b border-(--color-silver) bg-(--color-paper-alt) px-6 py-8">
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => selectSection("faculties")}
                className={`rounded-xl border p-5 text-right transition ${
                  section === "faculties"
                    ? "border-(--color-gold) bg-white shadow-sm"
                    : "border-(--color-silver) bg-white/60 hover:border-(--color-gold)/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-(--color-gold-dim)" />
                  <span className="font-bold text-(--color-navy)">قسم كورسات الكليات</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-(--color-muted)">
                  حقوق طنطا، إسكندرية، فاروس، وشريعة وقانون — من الفرقة الأولى للرابعة
                </p>
              </button>

              <button
                onClick={() => selectSection("postgraduate")}
                className={`relative rounded-xl border p-5 text-right transition ${
                  section === "postgraduate"
                    ? "border-(--color-gold) bg-white shadow-sm"
                    : "border-(--color-silver) bg-white/60 hover:border-(--color-gold)/50"
                }`}
              >
                <span className="absolute left-4 top-4 rounded-full bg-(--color-gold)/15 px-2.5 py-1 text-[11px] font-bold text-(--color-gold-dim)">
                  قريبًا
                </span>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-(--color-gold-dim)" />
                  <span className="font-bold text-(--color-navy)">قسم الدراسات العليا</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-(--color-muted)">
                  هنعلن عن برامج الدراسات العليا وتقسيمها بمجرد ما تتحدد.
                </p>
              </button>
            </div>
          </section>

          {section === "postgraduate" ? (
            <section className="px-6 py-24 text-center">
              <Building2 className="mx-auto h-10 w-10 text-(--color-gold)/60" />
              <h2 className="mt-4 text-xl font-bold text-(--color-navy)">قسم الدراسات العليا قريبًا</h2>
              <p className="mx-auto mt-3 max-w-md leading-7 text-(--color-muted)">
                بنجهّز تصنيف برامج الدراسات العليا دلوقتي، وهيظهر هنا أول ما يخلص.
              </p>
            </section>
          ) : (
            <section className="px-6 py-14">
              <div className="mx-auto max-w-6xl">
                {/* خطوة 1: اختيار الكلية */}
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-(--color-navy)">اختار كليتك:</span>
                  {FACULTIES.map((f) => (
                    <button
                      key={f}
                      onClick={() => selectFaculty(f)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                        faculty === f
                          ? "border-(--color-gold) bg-(--color-gold)/10 text-(--color-gold-dim)"
                          : "border-(--color-silver) text-(--color-navy) hover:border-(--color-gold)/50"
                      }`}
                    >
                      {FACULTY_LABELS[f]}
                    </button>
                  ))}
                </div>

                {/* خطوة 2: اختيار الفرقة (تظهر بس بعد اختيار الكلية) */}
                {faculty && (
                  <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-(--color-navy)">الفرقة:</span>
                    {ACADEMIC_YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => selectYear(y)}
                        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                          academicYear === y
                            ? "border-(--color-gold) bg-(--color-gold)/10 text-(--color-gold-dim)"
                            : "border-(--color-silver) text-(--color-navy) hover:border-(--color-gold)/50"
                        }`}
                      >
                        {ACADEMIC_YEAR_LABELS[y]}
                      </button>
                    ))}
                    <button
                      onClick={resetFaculty}
                      className="text-xs text-(--color-muted) underline hover:text-(--color-navy)"
                    >
                      غيّر الكلية
                    </button>
                  </div>
                )}

                {!faculty && (
                  <div className="rounded-xl border border-dashed border-(--color-silver) px-6 py-16 text-center">
                    <GraduationCap className="mx-auto h-8 w-8 text-(--color-gold)/50" />
                    <p className="mt-3 text-sm text-(--color-muted)">اختار كليتك فوق عشان تشوف كورساتها</p>
                  </div>
                )}

                {faculty && !academicYear && (
                  <div className="rounded-xl border border-dashed border-(--color-silver) px-6 py-16 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-(--color-gold)/50" />
                    <p className="mt-3 text-sm text-(--color-muted)">اختار فرقتك فوق عشان تشوف الكورسات المتاحة</p>
                  </div>
                )}

                {faculty && academicYear && (
                  <CourseCatalogGrid track="STUDENT_COURSE" faculty={faculty} academicYear={academicYear} />
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA */}
      <section className="bg-(--color-navy-deep) px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-white">عندك حساب بالفعل؟</h2>
        <p className="mx-auto mt-3 max-w-md text-white/70">
          ادخل بوابة الطالب عشان تكمّل كورساتك وتشوف تقدمك وشهاداتك.
        </p>
        <Link
          to="/student/login"
          className="mt-7 inline-block rounded-md bg-(--color-gold) px-8 py-4 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)"
        >
          بوابة الطالب
        </Link>
      </section>
    </div>
  );
}
