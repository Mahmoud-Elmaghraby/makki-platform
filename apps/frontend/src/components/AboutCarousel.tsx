import { useEffect, useState } from "react";

type Slide = {
  kicker: string;
  title: string;
  paragraphs: string[];
  points?: string[];
  cta?: { label: string; href: string };
  image: string;
};

// TODO: استبدال النصوص والصور بمحتوى نهائي معتمد من مكي
const slides: Slide[] = [
  {
    kicker: "من نحن",
    title: "شريككم القانوني",
    paragraphs: [
      "تأسس مكتب مكي للمحاماة على مبدأ بسيط: تقديم استشارة قانونية واضحة، صادقة، وقريبة من احتياجات كل عميل.",
      "يضم فريقنا نخبة من المحامين المتخصصين في مختلف فروع القانون، ملتزمين بأعلى معايير المهنية والسرية.",
    ],
    points: ["فريق متخصص", "متابعة شخصية", "شفافية كاملة"],
    cta: { label: "تعرّف على فريقنا ←", href: "/about" },
    image: "/carousel/Slide1.jpg",
  },
  {
    kicker: "أكاديمية مكي",
    title: "تأهيل وتدريب لطلبة الحقوق والمحامين",
    paragraphs: [
      "إلى جانب المحاماة والاستشارات، نقدّم عبر أكاديمية مكي برامج تدريبية متخصصة لطلبة كليات الحقوق والمحامين الممارسين.",
      "محتوى عملي مبني على خبرة حقيقية، بشهادات إتمام لكل مسار.",
    ],
    points: ["مسار الطلبة", "مسار المحامين", "تأهيل وتدريب"],
    cta: { label: "اكتشف دوراتنا التدريبية ←", href: "/courses" },
    image: "/carousel/Slide2.jpg",
  },
  {
    kicker: "عملاؤنا",
    title: "ثقة أفراد وشركات على حد سواء",
    paragraphs: [
      "نتشرف بخدمة قاعدة متنوعة من العملاء، من الأفراد وحتى الشركات الناشئة والمؤسسات التجارية.",
    ],
    points: ["أفراد", "شركات ناشئة", "مؤسسات تجارية"],
    cta: { label: "احجز استشارتك الآن ←", href: "/contact" },
    image: "/carousel/Slide3.jpg",
  },
];

export default function AboutCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <section className="bg-(--color-paper-alt) px-6 py-20">
      <div key={index} className="slide-fade mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center overflow-hidden rounded-xl bg-(--color-silver-light) sm:h-80 md:h-[420px]">
          <img src={slide.image} alt={slide.title} className="h-full w-full object-contain" />
        </div>

        <div>
          <div className="mb-2 text-sm font-bold text-(--color-gold-dim)">{slide.kicker}</div>
          <h2 className="text-2xl font-extrabold text-(--color-navy) md:text-3xl">{slide.title}</h2>

          {slide.paragraphs.map((p, i) => (
            <p key={i} className="mt-5 leading-8 text-(--color-muted)">{p}</p>
          ))}

          {slide.points && (
            <div className="mt-7 flex flex-wrap gap-6">
              {slide.points.map((pt) => (
                <div key={pt} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-(--color-gold)" />
                  <span className="text-sm font-semibold text-(--color-navy)">{pt}</span>
                </div>
              ))}
            </div>
          )}

          {slide.cta && (
            <a href={slide.cta.href} className="mt-6 inline-block text-sm font-bold text-(--color-gold-dim) hover:text-(--color-navy)">
              {slide.cta.label}
            </a>
          )}

          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              aria-label="الشريحة السابقة"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="grid h-9 w-9 place-items-center rounded-full border border-(--color-silver) text-(--color-navy) hover:border-(--color-gold)"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`الشريحة ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-(--color-gold)" : "w-2 bg-(--color-silver)"}`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="الشريحة التالية"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              className="grid h-9 w-9 place-items-center rounded-full border border-(--color-silver) text-(--color-navy) hover:border-(--color-gold)"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
