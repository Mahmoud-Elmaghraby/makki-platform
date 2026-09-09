import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Scale, PlayCircle, ClipboardCheck, Award } from "lucide-react";

const FEATURES = [
  { icon: PlayCircle, text: "كورسات ودورات تدريبية بمعايير عملية حقيقية" },
  { icon: ClipboardCheck, text: "امتحانات ومتابعة تقدّمك في كل درس أول بأول" },
  { icon: Award, text: "شهادة إتمام رسمية بعد كل كورس أو دورة" },
];

interface StudentAuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * الغلاف المشترك لصفحتي دخول/تسجيل الطالب — شاشة مقسومة: فورم في نص
 * الشاشة (زي ما كان)، وجنبه (على الشاشات الكبيرة بس) لوحة تعريفية بهوية
 * الشركة بدل الخلفية الكحلية الفاضية اللي كانت موجودة قبل كده.
 */
export function StudentAuthLayout({ title, subtitle, children, footer }: StudentAuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-(--color-paper)">
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:w-1/2 lg:flex-none">
        <div className="w-full max-w-sm">
          <div className="mb-7 flex flex-col items-center text-center">
            <Link to="/" className="mb-3 flex h-14 w-14 items-center justify-center">
              <img src="/logo.png" alt="مكي وشركاؤه" className="h-14 w-14 object-contain" />
            </Link>
            <h1 className="font-display text-2xl font-semibold text-(--color-navy)">{title}</h1>
            <p className="mt-1.5 text-sm text-(--color-muted)">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 text-center text-sm text-(--color-muted)">{footer}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-(--color-navy) via-(--color-navy) to-(--color-navy-deep) lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-(--color-gold)/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-(--color-royal-light)/20 blur-3xl" />
        <Scale className="pointer-events-none absolute -bottom-12 -left-12 h-72 w-72 text-white/[0.04]" />

        <div className="relative z-10 max-w-md px-10 text-white">
          <div className="mb-3 text-sm font-bold tracking-wide text-(--color-gold)">
            أكاديمية مكي وشركاؤه
          </div>
          <h2 className="font-display text-3xl font-bold leading-snug">
            بوابة الطالب — تعلّم، اتقدّم، واتأهّل بثقة
          </h2>
          <ul className="mt-9 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-(--color-gold)" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
