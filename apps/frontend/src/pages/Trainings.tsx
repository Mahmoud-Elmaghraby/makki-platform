import { useState } from "react";
import { Link } from "react-router-dom";
import { CourseCatalogGrid } from "../components/CourseCatalogGrid";
import { CourseSearchBox } from "../components/CourseSearchBox";

/**
 * "دوراتنا التدريبية" — صفحة مستقلة بالكامل مخصصة لدورات المحامين
 * الممارسين (LAWYER_TRAINING) بس. منفصلة تمامًا عن "كورساتنا" (Courses.tsx).
 */
export default function Trainings() {
  const [q, setQ] = useState("");

  return (
    <div>
      <section className="bg-(--color-navy) px-6 py-20 text-center">
        <div className="mb-3 text-sm font-bold text-(--color-gold)">أكاديمية مكي</div>
        <h1 className="text-3xl font-extrabold text-white md:text-4xl">دوراتنا التدريبية</h1>
        <p className="mx-auto mt-5 max-w-xl leading-8 text-white/70">
          دورات تدريبية متخصصة للمحامين الممارسين، بمعايير عملية حقيقية وتطبيق مباشر
          على القضايا، عشان نبني جيل قانوني مؤهل باستمرار.
        </p>
      </section>

      <section className="px-6 pt-14">
        <CourseSearchBox
          value={q}
          onChange={setQ}
          placeholder="دوّر عن دورة تدريبية... (مثال: تحكيم تجاري)"
        />
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <CourseCatalogGrid track="LAWYER_TRAINING" q={q} />
        </div>
      </section>

      <section className="bg-(--color-navy-deep) px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-white">عندك حساب بالفعل؟</h2>
        <p className="mx-auto mt-3 max-w-md text-white/70">
          ادخل بوابة الطالب عشان تكمّل دوراتك وتشوف تقدمك وشهاداتك.
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
