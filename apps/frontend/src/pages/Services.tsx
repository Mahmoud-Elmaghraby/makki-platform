const services = [
  { title: "قانون الشركات", desc: "تأسيس، حوكمة، واندماج وشراء الشركات." },
  { title: "التقاضي التجاري", desc: "تمثيل أمام المحاكم في المنازعات التجارية." },
  { title: "قانون العمل", desc: "عقود العمل، اللوائح، وتسوية المنازعات العمالية." },
  { title: "الملكية الفكرية", desc: "حماية العلامات التجارية وحقوق الملكية الفكرية." },
  { title: "الأحوال الشخصية", desc: "قضايا الأسرة والميراث والوصايا." },
  { title: "القانون الجنائي", desc: "الدفاع والتمثيل في القضايا الجنائية." },
];

export default function Services() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-sm font-medium text-(--color-bronze)">خدماتنا</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-(--color-royal)">
        مجالات الممارسة القانونية
      </h1>
      {/* TODO: تأكيد قائمة المجالات الفعلية مع العميل */}

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.title}
            className="rounded-xl border border-(--color-silver) p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="font-medium text-(--color-royal)">{s.title}</h3>
            <p className="mt-2 text-sm leading-7 text-(--color-ink)/65">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
