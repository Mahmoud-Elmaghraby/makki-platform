import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

// ============================================================
// عناصر واجهة أساسية بسيطة، متسقة مع هوية الموقع (كحلي + دهبي) —
// من غير مكتبة UI خارجية، عشان نفضل في حدود الأسلوب المبسّط المتفق عليه.
// ============================================================

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
        variant === "primary" && "bg-(--color-navy) text-(--color-gold) hover:bg-(--color-navy-deep)",
        variant === "secondary" && "bg-(--color-paper-alt) text-(--color-navy) hover:bg-(--color-silver-light) border border-(--color-silver)",
        variant === "ghost" && "bg-transparent text-(--color-navy) hover:bg-(--color-paper-alt)",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-(--color-silver) bg-white px-3 py-2 text-sm text-(--color-ink) outline-none transition placeholder:text-(--color-muted) focus:border-(--color-royal-light) focus:ring-2 focus:ring-(--color-royal-light)/20",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-(--color-silver) bg-white px-3 py-2 text-sm text-(--color-ink) outline-none transition placeholder:text-(--color-muted) focus:border-(--color-royal-light) focus:ring-2 focus:ring-(--color-royal-light)/20",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-(--color-silver) bg-white px-3 py-2 text-sm text-(--color-ink) outline-none transition focus:border-(--color-royal-light) focus:ring-2 focus:ring-(--color-royal-light)/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-(--color-navy)">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-(--color-muted)">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-xl border border-(--color-silver-light) bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-(--color-navy)">{title}</h1>
        {description && <p className="mt-1 text-sm text-(--color-muted)">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "gold";
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-(--color-paper-alt) text-(--color-muted)",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-red-50 text-red-700",
        tone === "gold" && "bg-(--color-gold)/15 text-(--color-gold-dim)",
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("h-5 w-5 animate-spin text-(--color-muted)", className)} />;
}

export function LoadingState({ label = "بيتم التحميل..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-(--color-muted)">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-(--color-silver) bg-(--color-paper-alt)/40 px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-(--color-navy)">{title}</h3>
      {description && <p className="max-w-sm text-sm text-(--color-muted)">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  widthClassName = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div
        className={clsx(
          "w-full rounded-2xl bg-white p-6 shadow-xl",
          widthClassName,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-(--color-navy)">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-(--color-muted) hover:bg-(--color-paper-alt)"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
