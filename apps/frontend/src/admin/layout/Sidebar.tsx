import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { Scale } from "lucide-react";
import { navItems } from "./navConfig";
import { useAdminAuth } from "../auth/AdminAuthContext";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAdminAuth();

  return (
    <div className="flex h-full w-64 shrink-0 flex-col bg-(--color-navy) text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-gold)/15">
          <Scale className="h-5 w-5 text-(--color-gold)" />
        </div>
        <div>
          <div className="font-display text-base font-semibold leading-tight">مكي وشركاؤه</div>
          <div className="text-xs text-white/50">لوحة التحكم</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems
          .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
          .map((item) => {
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

      <div className="border-t border-white/10 px-5 py-4 text-xs text-white/40">
        نسخة تجريبية — Phase 1
      </div>
    </div>
  );
}
