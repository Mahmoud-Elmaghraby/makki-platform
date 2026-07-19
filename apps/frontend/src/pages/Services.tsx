const departments = [
  {
    title: "قسم القضايا والاستشارات القانونية",
    intro: "فريق متخصص في مباشرة القضايا أمام جميع المحاكم والهيئات القضائية، في مختلف فروع القانون.",
    items: [
      "القضايا المدنية",
      "القضايا الجنائية",
      "قضايا الأحوال الشخصية",
      "القضايا الإدارية",
      "المنازعات التجارية",
      "التحكيم التجاري والدولي",
      "الاستشارات القانونية للأفراد والشركات",
    ],
  },
  {
    title: "قسم تأسيس الشركات",
    intro: "لو بتبدأ مشروع جديد أو عايز تقنن نشاطك، إحنا معاك خطوة بخطوة.",
    items: [
      "تأسيس جميع أنواع الشركات",
      "تعديل عقود الشركات",
      "تعديل وتجديد السجلات التجارية",
      "حل وتصفية الشركات",
      "صياغة العقود التجارية وترجمتها",
      "الاستشارات القانونية الخاصة بالشركات ورواد الأعمال",
    ],
  },
  {
    title: "قسم الملكية الفكرية",
    intro: "لو عندك علامة تجارية، اسم براند، شعار، أو فكرة مميزة، إحنا بنحميها قانونيًا من الألف للياء.",
    items: [
      "تسجيل العلامات التجارية",
      "تسجيل حقوق الملكية الفكرية",
      "إنهاء جميع الإجراءات القانونية حتى الحصول على الحماية القانونية الكاملة",
    ],
  },
  {
    title: "قسم التدريب والتأهيل",
    intro: "تدريب عملي وتأهيل حقيقي لطلبة وخريجي كليات الحقوق والشريعة والقانون، مش كورسات نظرية وخلاص.",
    items: [
      "أحدث المناهج القانونية",
      "التطبيق العملي على القضايا",
      "صياغة المذكرات والعقود",
      "المهارات اللي سوق العمل فعلًا بيدور عليها",
      "تطوير مهارات البحث العلمي",
    ],
    link: { label: "اطّلع على دوراتنا التدريبية ←", href: "/courses" },
  },
];

export default function Services() {
  return (
    <div>
      <section className="bg-(--color-navy) px-6 py-20 text-center">
        <p className="text-sm font-medium text-(--color-gold)">
          أول شركة معتمدة في محافظة البحيرة من قبل النقابة العامة ووزارة العدل - مقيدة برقم 231
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white md:text-4xl">
          خدماتنا
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          خدمات قانونية وتدريب عملي في مكان واحد، بأعلى معايير الاحترافية.
        </p>
      </section>

      <section className="bg-(--color-paper-alt) px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {departments.map((dept) => (
            <div key={dept.title} className="rounded-xl border border-(--color-silver) bg-(--color-paper) p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-gold)/10">
                <div className="h-5 w-5 rounded bg-(--color-gold)" />
              </div>
              <h2 className="text-xl font-bold text-(--color-navy)">{dept.title}</h2>
              <p className="mt-3 text-sm leading-7 text-(--color-muted)">{dept.intro}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {dept.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-(--color-navy)">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-gold)" />
                    {item}
                  </li>
                ))}
              </ul>
              {dept.link && (
                <a href={dept.link.href} className="mt-6 inline-block text-sm font-bold text-(--color-gold-dim) hover:text-(--color-navy)">
                  {dept.link.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-(--color-navy) px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-white">محتاج استشارة قانونية؟</h2>
        <a href="/contact" className="mt-7 inline-block rounded-md bg-(--color-gold) px-8 py-4 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)">
          احجز استشارتك الآن
        </a>
      </section>
    </div>
  );
}
