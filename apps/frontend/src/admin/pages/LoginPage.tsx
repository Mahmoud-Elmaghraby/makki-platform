import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Scale } from "lucide-react";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { Button, Field, Input, ErrorBanner } from "../components/ui";
import { extractErrorMessage } from "../lib/apiClient";

export function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-(--color-navy) px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-navy)">
            <Scale className="h-7 w-7 text-(--color-gold)" />
          </div>
          <h1 className="font-display text-xl font-semibold text-(--color-navy)">
            لوحة تحكم مكي وشركاؤه
          </h1>
          <p className="mt-1 text-sm text-(--color-muted)">سجّل دخولك كأدمن أو مدرب</p>
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
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <ErrorBanner message={error} />}

          <Button type="submit" className="w-full" loading={loading}>
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
}
