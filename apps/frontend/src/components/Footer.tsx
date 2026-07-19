import { Link } from "react-router-dom";

const practiceAreas = ["القانون التجاري", "الأحوال الشخصية", "القانون العقاري", "القانون الجنائي", "قانون العمل", "تأسيس الشركات"];

export default function Footer() {
  return (
    <footer className="bg-(--color-navy-deep)">
      <div className="mx-auto grid max-w-6xl gap-10 border-b border-white/10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="مكي للمحاماة" className="h-9 w-9 object-contain" />
            <span className="text-lg font-extrabold text-white">مكي للمحاماة</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/50">
            مكتب محاماة موثوق يقدم حلولاً قانونية واضحة وشخصية لكل عميل.
          </p>
        </div>
        <div>
          <div className="mb-4 text-sm font-bold text-white">روابط سريعة</div>
          <nav className="flex flex-col gap-2.5 text-sm text-white/60">
            <Link to="/about" className="hover:text-white">عن الشركة</Link>
            <Link to="/services" className="hover:text-white">خدماتنا</Link>
            <Link to="/courses" className="hover:text-white">دوراتنا</Link>
          </nav>
        </div>
        <div>
          <div className="mb-4 text-sm font-bold text-white">مجالات الممارسة</div>
          <div className="flex flex-col gap-2.5 text-sm text-white/60">
            {practiceAreas.map((p) => <span key={p}>{p}</span>)}
          </div>
        </div>
        <div>
          <div className="mb-4 text-sm font-bold text-white">تواصل معنا</div>
          <ul className="flex flex-col gap-2.5 text-sm text-white/60">
            <li dir="ltr" className="text-right">01026561277</li>
            <li dir="ltr" className="text-right">0453241410</li>
            <li>دمنهور – آخر شارع تشاومول – أمام بن الكوربة – أعلى ماركت الإخلاص – الدور الثالث</li>
          </ul>
        </div>
      </div>
      <div className="px-6 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} مكي للمحاماة. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
