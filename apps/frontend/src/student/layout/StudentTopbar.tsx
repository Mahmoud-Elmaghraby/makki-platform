import { useState } from "react";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudentAuth } from "../auth/StudentAuthContext";
import { apiClient } from "../lib/apiClient";
import { NotificationBell } from "../../components/NotificationBell";

export function StudentTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { student, logout } = useStudentAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/student/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-(--color-silver-light) bg-white px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-(--color-navy) hover:bg-(--color-paper-alt) md:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
      <NotificationBell apiClient={apiClient} basePath="/notifications/me" queryKey="student-notifications" />
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-(--color-paper-alt)"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-navy) text-xs font-semibold text-(--color-gold)">
            {student?.name?.slice(0, 1) ?? "?"}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-(--color-navy)">{student?.name}</div>
            <div className="text-xs text-(--color-muted)">{student?.phone}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-(--color-muted)" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 z-20 mt-2 w-44 rounded-lg border border-(--color-silver-light) bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </header>
  );
}
