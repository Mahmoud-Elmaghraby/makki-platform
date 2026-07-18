const studentCourses = [
  { title: "مبادئ القانون المدني", desc: "أساسيات القانون المدني بأسلوب مبسط لطلبة كليات الحقوق." },
  { title: "أساسيات القانون التجاري", desc: "مدخل شامل لمفاهيم القانون التجاري وتطبيقاته العملية." },
  { title: "مهارات البحث القانوني", desc: "كيفية البحث في المراجع والأحكام القضائية بفعالية." },
];

const lawyerCourses = [
  { title: "صياغة العقود القانونية باحتراف", desc: "أساليب صياغة عقود دقيقة تحمي مصالح الأطراف." },
  { title: "مهارات المرافعة أمام المحاكم", desc: "تقنيات الإقناع والمرافعة الفعالة في قاعات المحاكم." },
  { title: "التحكيم التجاري الدولي", desc: "أساسيات التحكيم التجاري وآليات فض المنازعات الدولية." },
];

function CourseGrid({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div key={c.title} className="rounded-lg border border-(--color-silver) p-7">
          <div className="mb-4 inline-block rounded-full bg-(--color-gold)/10 px-3 py-1 text-xs font-bold text-(--color-gold-dim)">
            قريبًا
          </div>
          <h3 className="font-bold text-(--color-navy)">{c.title}</h3>
          <p className="mt-2 text-sm leading-7 text-(--color-muted)">{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function Courses() {
  return (
    <div>
      <section className="bg-(--color-navy) px-6 py-20 text-center">
        <div className="mb-3 text-sm font-bold text-(--color-gold)">أكاديمية مكي</div>
        <h1 className="text-3xl font-extrabold text-white md:text-4xl">
          برامج تأهيل وتدريب قانوني متخصصة
        </h1>
        <p className="mx-auto mt-5 max-w-xl leading-8 text-white/70">
          مكتب مكي مش بس بيقدّم محاماة واستشارات قانونية - كمان بيقدّم دورات تدريبية متخصصة
          لطلبة كليات الحقوق والمحامين الممارسين، عشان نبني جيل قانوني مؤهل بمعايير عملية حقيقية.
        </p>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-extrabold text-(--color-navy)">لطلبة كليات الحقوق</h2>
          <CourseGrid items={studentCourses} />
        </div>
      </section>

      <section className="bg-(--color-paper-alt) px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-extrabold text-(--color-navy)">للمحامين الممارسين</h2>
          <CourseGrid items={lawyerCourses} />
        </div>
      </section>

      <section className="bg-(--color-navy-deep) px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-white">عايز تسجل اهتمامك بأي دورة؟</h2>
        <p className="mx-auto mt-3 max-w-md text-white/70">تواصل معنا وهنبلغك أول ما التسجيل يفتح.</p>
        <a href="/contact" className="mt-7 inline-block rounded-md bg-(--color-gold) px-8 py-4 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)">
          تواصل معنا
        </a>
      </section>
    </div>
  );
}
