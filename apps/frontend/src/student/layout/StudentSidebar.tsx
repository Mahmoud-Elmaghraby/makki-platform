import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { studentNavItems } from "./navConfig";

export function StudentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col bg-(--color-navy) text-white">
      {/* اللوجو والاسم بيودّوا للموقع التعريفي — قبل كده مفيش أي طريقة رجوع
          من بوابة الطالب للموقع الرئيسي خالص. */}
      <Link
        to="/"
        className="flex items-center gap-3 border-b border-white/10 px-5 py-5 transition hover:bg-white/5"
      >
        <img src="/logo.png" alt="مكي وشركاؤه" className="h-10 w-10 shrink-0 object-contain" />
        <div>
          <div className="font-display text-base font-semibold leading-tight">مكي وشركاؤه</div>
          <div className="text-xs text-white/50">بوابة الطالب</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-white/10 text-(--color-gold)"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowRight className="h-5 w-5 shrink-0" />
          <span>الموقع الرئيسي</span>
        </Link>
      </div>
    </div>
  );
}
