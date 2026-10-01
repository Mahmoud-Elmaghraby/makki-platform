import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { Button, Field, Input, ErrorBanner } from "../components/ui";
import { extractErrorMessage } from "../lib/apiClient";

export function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/admin";
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--color-paper-alt) md:grid md:grid-cols-2">
      {/* اللوحة التعريفية — ظاهرة بس من حجم md لفوق، فاضية على الموبايل عشان
          الشاشة الصغيرة تركّز على الفورم مباشرة من غير سكرول زيادة. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-(--color-navy) px-12 py-14 text-white md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-(--color-gold)/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-(--color-gold)/10 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="مكي وشركاؤه"
              className="h-14 w-14 shrink-0 rounded-xl bg-white/5 object-contain p-1 ring-1 ring-white/10"
            />
            <div>
              <div className="font-display text-lg font-semibold">مكي وشركاؤه</div>
              <div className="text-xs text-white/50">للمحاماة والاستشارات القانونية</div>
            </div>
          </div>

          <div className="mt-20">
            <h1 className="font-display max-w-sm text-3xl font-semibold leading-snug">
              لوحة تحكم أكاديمية مكي
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
              من هنا بتتابع كورساتك ودوراتك التدريبية، طلابك، اشتراكاتهم،
              ومدفوعاتهم — كل حاجة في مكان واحد.
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-white/40">
          <ShieldCheck className="h-4 w-4 text-(--color-gold)/70" />
          <span>وصول مقصور على فريق العمل المصرّح له بس</span>
        </div>
      </div>

      {/* الفورم */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12 md:min-h-0">
        <div className="w-full max-w-sm">
          {/* هوية مصغّرة للموبايل بس — على الشاشات الكبيرة اللوحة الشمال كفاية */}
          <div className="mb-8 flex flex-col items-center text-center md:hidden">
            <img
              src="/logo.png"
              alt="مكي وشركاؤه"
              className="mb-3 h-16 w-16 rounded-xl object-contain"
            />
            <div className="font-display text-lg font-semibold text-(--color-navy)">
              مكي وشركاؤه
            </div>
            <div className="text-xs text-(--color-muted)">لوحة التحكم</div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-xl shadow-(--color-navy)/5 ring-1 ring-(--color-silver-light)">
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-(--color-navy)">
                تسجيل الدخول
              </h2>
              <p className="mt-1 text-sm text-(--color-muted)">
                سجّل دخولك كأدمن أو مدير أو مدرب
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="البريد الإلكتروني">
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  dir="ltr"
                />
              </Field>

              <Field label="كلمة السر">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error && <ErrorBanner message={error} />}

              <Button type="submit" className="w-full" size="md" loading={loading}>
                تسجيل الدخول
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-(--color-muted)">
            نسيت بيانات الدخول؟ تواصل مع إدارة النظام.
          </p>
        </div>
      </div>
    </div>
  );
}
