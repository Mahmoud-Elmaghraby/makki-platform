import { Link } from "react-router-dom";
import AboutCarousel from "../components/AboutCarousel";

const practiceAreas = [
  { title: "القضايا والاستشارات القانونية", desc: "قضايا مدنية وجنائية وإدارية، ومنازعات تجارية وتحكيم." },
  { title: "تأسيس الشركات", desc: "تأسيس جميع أنواع الشركات وتعديل عقودها وتصفيتها." },
  { title: "الملكية الفكرية", desc: "تسجيل العلامات التجارية وحماية حقوق الملكية الفكرية." },
  { title: "التدريب والتأهيل", desc: "تدريب عملي وتأهيل حقيقي لطلبة وخريجي كليات الحقوق." },
];

const stats = [
  { value: "أول شركة معتمدة", label: "في محافظة البحيرة رسميًا" },
  { value: "قيد رقم 231", label: "معتمدة من النقابة العامة ووزارة العدل" },
  { value: "خبرة قانونية", label: "داخل وخارج مصر" },
  { value: "خدمات + تدريب", label: "في مكان واحد" },
];

// TODO: تأكيد الأسماء والمناصب الحقيقية - القيم دي تقديرية مؤقتة
const teamPreview = [
  { name: "د. أحمد مكي", role: "المدير التنفيذي للشركة، المحامي بالنقض، ماجستير قانون عام وباحث دكتوراه", image: "/team/DR-Ahmed3.jpg" },
  { name: "أ. يحيى صلاح النعناعي", role: "المحامي بالنقض، رئيس قسم القانون المدني بالشركة", image: "/team/DR-Yahya3.jpg" },
  { name: "د. أحمد إبراهيم حمام", role: "دكتوراه في القانون الإداري", image: "/team/DR-Hassan3.jpg" },
  { name: "أ. عبير جمعة", role: "ماجستير في القانون، رئيس قسم الأحوال الشخصية بالشركة", image: "/team/DR-Mona3.jpg" },
  { name: "أ. حسام قدري", role: "المحامي، دبلومة من الجامعة البريطانية، رئيس قسم تأسيس الشركات والملكية الفكرية", image: "/team/DR-Hossam3.jpg" },
];

export default function Home() {
  return (
    <div>
      <section className="bg-(--color-navy)">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-(--color-gold)">
              ثقة موثوقة في الاستشارات القانونية
              <span className="h-2 w-2 rounded-full bg-(--color-gold)" />
            </div>
            <h1 className="text-3xl font-extrabold leading-snug text-white md:text-5xl">
              خبرة قانونية تقف بجانبك في كل قضية
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-white/70">
              مكتب مكي للمحاماة يقدّم محاماة واستشارات قانونية، وبرامج تأهيل وتدريب متخصصة
              لطلبة كليات الحقوق والمحامين الممارسين.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-7">
              <Link to="/contact" className="rounded-md bg-(--color-gold) px-8 py-4 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)">
                احجز استشارة مجانية
              </Link>
              <Link to="/services" className="text-sm font-bold text-white/80 hover:text-white">
                مجالات ممارستنا
              </Link>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-xl">
            <img
              src="/hero-lawyer.jpg"
              alt="فريق مكتب مكي للمحاماة"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="bg-(--color-navy) py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 text-center sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-(--color-gold)" />
              <div className="text-base font-extrabold text-(--color-gold) md:text-lg">{s.value}</div>
              <div className="mt-2 text-xs font-medium text-white/60 md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="practice" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <div className="mb-2 text-sm font-bold text-(--color-gold-dim)">مجالات ممارستنا</div>
            <h2 className="text-2xl font-extrabold text-(--color-navy) md:text-3xl">خدمات قانونية متكاملة</h2>
            <p className="mt-3 text-(--color-muted)">نغطي أهم المجالات القانونية بفريق متخصص في كل قسم.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {practiceAreas.map((area) => (
              <div key={area.title} className="rounded-lg border border-(--color-silver) p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-gold)/10">
                  <div className="h-5 w-5 rounded bg-(--color-gold)" />
                </div>
                <h3 className="font-bold text-(--color-navy)">{area.title}</h3>
                <p className="mt-2 text-sm leading-7 text-(--color-muted)">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AboutCarousel />


      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold text-(--color-navy) md:text-3xl">فريقنا</h2>
            <Link to="/about" className="text-sm font-bold text-(--color-gold-dim) hover:text-(--color-navy)">كل الفريق ←</Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {teamPreview.map((m) => (
              <div key={m.name}>
                <img src={m.image} alt={m.name} className="aspect-3/4 w-full rounded-lg object-cover" />
                <h3 className="mt-4 font-bold text-(--color-navy)">{m.name}</h3>
                <p className="text-sm text-(--color-gold-dim)">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-(--color-navy-deep) px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-white">ابدأ استشارتك المجانية اليوم</h2>
        <p className="mx-auto mt-3 max-w-md text-white/70">فريقنا جاهز للاستماع لقضيتك وتقديم أفضل الحلول القانونية المناسبة لك.</p>
        <Link to="/contact" className="mt-7 inline-block rounded-md bg-(--color-gold) px-8 py-4 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)">
          احجز استشارتك الآن
        </Link>
      </section>
    </div>
  );
}
