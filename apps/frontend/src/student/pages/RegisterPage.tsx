import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useStudentAuth } from "../auth/StudentAuthContext";
import { StudentAuthLayout } from "../components/StudentAuthLayout";
import { Button, Field, Input, ErrorBanner } from "../../admin/components/ui";
import { extractErrorMessage } from "../lib/apiClient";

export function RegisterPage() {
  const { register } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ name, phone, email: email || undefined, password });
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/student";
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentAuthLayout
      title="إنشاء حساب طالب"
      subtitle="هتقدر تشترك في الكورسات والدورات بعدها"
      footer={
        <>
          عندك حساب بالفعل؟{" "}
          <Link to="/student/login" className="font-medium text-(--color-royal-light)">
            سجّل دخولك
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="الاسم">
          <Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="رقم التليفون" hint="لازم يكون رقم مصري صحيح، وده هتسجل دخول بيه">
          <Input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            dir="ltr"
          />
        </Field>
        <Field label="الإيميل (اختياري)">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="كلمة السر" hint="6 حروف/أرقام على الأقل">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && <ErrorBanner message={error} />}

        <Button type="submit" className="w-full" loading={loading}>
          إنشاء الحساب
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-(--color-silver)" />
        <span className="text-xs text-(--color-muted)">أو</span>
        <div className="h-px flex-1 bg-(--color-silver)" />
      </div>

      <a
        href={`${import.meta.env.VITE_API_URL ?? "http://localhost:4001"}/auth/student/google`}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-(--color-silver) bg-white py-2.5 text-sm font-medium text-(--color-ink) transition hover:bg-(--color-paper-alt)"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1C3.25 21.3 7.31 24 12 24Z"/>
          <path fill="#FBBC05" d="M5.27 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.27a12 12 0 0 0 0 10.8l4-3.1Z"/>
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.6l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"/>
        </svg>
        التسجيل بحساب جوجل
      </a>
    </StudentAuthLayout>
  );
}
