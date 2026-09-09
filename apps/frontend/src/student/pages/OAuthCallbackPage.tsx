import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStudentAuth } from "../auth/StudentAuthContext";
import { ErrorBanner } from "../../admin/components/ui";

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin } = useStudentAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("حصل خطأ أثناء الدخول بجوجل، حاول تاني");
      return;
    }

    completeGoogleLogin(token)
      .then(() => navigate("/student", { replace: true }))
      .catch(() => setError("حصل خطأ أثناء الدخول بجوجل، حاول تاني"));
  }, [searchParams, completeGoogleLogin, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--color-navy) px-4 text-center">
      {error ? (
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <ErrorBanner message={error} />
          <a
            href="/student/login"
            className="mt-4 block text-sm font-medium text-(--color-royal-light)"
          >
            ارجع لصفحة تسجيل الدخول
          </a>
        </div>
      ) : (
        <p className="text-sm text-white/80">بنسجّل دخولك...</p>
      )}
    </div>
  );
}
