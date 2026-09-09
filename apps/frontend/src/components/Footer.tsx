import { Link } from "react-router-dom";

const practiceAreas = ["القانون التجاري", "الأحوال الشخصية", "القانون العقاري", "القانون الجنائي", "قانون العمل", "تأسيس الشركات"];

export default function Footer() {
  return (
    <footer className="bg-(--color-navy-deep)">
      <div className="mx-auto grid max-w-6xl gap-10 border-b border-white/10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="شركة مكي وشركاؤه" className="h-9 w-9 object-contain" />
            <span className="text-lg font-extrabold text-white">شركة مكي وشركاؤه</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/50">
            مكتب محاماة موثوق يقدم حلولاً قانونية واضحة وشخصية لكل عميل.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://www.facebook.com/share/1F77Jmt9ii/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="فيسبوك"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-(--color-gold) hover:text-(--color-gold)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-8.4h2.8l.4-3.3h-3.2V7c0-.95.27-1.6 1.63-1.6H17V2.4C16.7 2.36 15.7 2.27 14.53 2.27c-2.4 0-4.03 1.46-4.03 4.15V9.3H7.7v3.3h2.8V21h3z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/mekky_legal_academy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="إنستجرام"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-(--color-gold) hover:text-(--color-gold)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://vm.tiktok.com/ZS9SRhkgTjoLw-AgOvk/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="تيك توك"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-(--color-gold) hover:text-(--color-gold)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.6 3c.3 1.9 1.5 3.3 3.4 3.6v2.9c-1.2 0-2.4-.4-3.4-1v6.1c0 3.1-2.5 5.4-5.5 5.4S5.6 17.7 5.6 14.6c0-3 2.4-5.4 5.4-5.4.3 0 .6 0 .9.1v2.9c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.1-2.5 2.6s1.1 2.5 2.5 2.5 2.6-1 2.6-2.5V3h3z" />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <div className="mb-4 text-sm font-bold text-white">روابط سريعة</div>
          <nav className="flex flex-col gap-2.5 text-sm text-white/60">
            <Link to="/about" className="hover:text-white">عن الشركة</Link>
            <Link to="/services" className="hover:text-white">خدماتنا</Link>
            <Link to="/courses" className="hover:text-white">كورساتنا</Link>
            <Link to="/trainings" className="hover:text-white">دوراتنا التدريبية</Link>
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
        © {new Date().getFullYear()} شركة مكي وشركاؤه. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
