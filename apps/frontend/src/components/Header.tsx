import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "الرئيسية" },
  { to: "/about", label: "عن الشركة" },
  { to: "/services", label: "خدماتنا" },
  { to: "/courses", label: "دوراتنا" },
  { to: "/contact", label: "تواصل معنا" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden bg-(--color-navy-deep) py-2 text-xs text-white/70 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-(--color-gold)" />
              info@makki-law.example
            </span>
            <span className="flex items-center gap-2" dir="ltr">
              <span className="h-1.5 w-1.5 rounded-full bg-(--color-gold)" />
              01026561277
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-(--color-gold)" />
              دمنهور، البحيرة
            </span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-(--color-navy)">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <NavLink to="/" className="flex shrink-0 items-center gap-3">
            <img src="/logo.png" alt="مكي للمحاماة" className="h-14 w-14 object-contain" />
            <div>
              <div className="text-lg font-extrabold text-white">مكي للمحاماة</div>
              <div className="flex items-center gap-2 text-xs font-semibold text-(--color-gold)">
                <span className="h-px w-4 bg-(--color-gold)/70" />
                محاماة · استشارات · تأهيل وتدريب
              </div>
            </div>
          </NavLink>

          {/* نافيجيشن + زرار الاستشارة مجمّعين في مجموعة واحدة عشان يفضلوا قريبين من بعض */}
          <div className="hidden items-center gap-8 md:flex">
            <nav className="flex items-center gap-7">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `border-b-2 pb-1 text-sm font-bold whitespace-nowrap transition-colors ${
                      isActive ? "border-(--color-gold) text-(--color-gold)" : "border-transparent text-white/80 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <NavLink
              to="/contact"
              className="shrink-0 rounded-md bg-(--color-gold) px-6 py-3 text-sm font-bold whitespace-nowrap text-(--color-navy) hover:bg-(--color-gold-dim)"
            >
              احجز استشارة
            </NavLink>
          </div>

          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white md:hidden"
            aria-label="فتح القائمة"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-white/10 px-6 py-4 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-bold ${isActive ? "bg-white/10 text-(--color-gold)" : "text-white/80"}`}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-(--color-gold) px-5 py-3 text-center text-sm font-bold text-(--color-navy)"
            >
              احجز استشارة
            </NavLink>
          </nav>
        )}
      </header>
    </>
  );
}
