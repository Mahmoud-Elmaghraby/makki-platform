import { useMemo, useState, type FormEvent } from "react";
import { Wallet, TrendingUp, CheckCircle2, Clock, XCircle, HandCoins } from "lucide-react";
import {
  Card,
  PageHeader,
  LoadingState,
  ErrorBanner,
  EmptyState,
  Badge,
  Select,
  Input,
  Field,
  Button,
} from "../components/ui";
import { usePaymentsAdmin, usePaymentsStatsAdmin, useRecordManualPayment } from "../hooks/usePayments";
import { useStudents } from "../hooks/useStudents";
import { useCourses } from "../hooks/useCourses";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { PaymentProvider, PaymentStatus } from "../types/api";

function formatEGP(amount: number) {
  return `${amount.toLocaleString("ar-EG")} جنيه`;
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "قيد الانتظار",
  PAID: "مدفوعة",
  FAILED: "فشلت",
  REFUNDED: "مسترجعة",
};

const STATUS_TONE: Record<PaymentStatus, "neutral" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};

const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  KASHIER: "كاشير",
  PAYMOB: "بايموب",
  MANUAL: "يدوي (فودافون كاش/تحويل)",
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-navy)/5">
        <Icon className="h-6 w-6 text-(--color-navy)" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-(--color-navy)">{value}</div>
        <div className="text-sm text-(--color-muted)">{label}</div>
      </div>
    </Card>
  );
}

function RecordManualPaymentForm() {
  const studentsQuery = useStudents();
  const studentCoursesQuery = useCourses("STUDENT_COURSE");
  const trainingsQuery = useCourses("LAWYER_TRAINING");
  const recordPayment = useRecordManualPayment();
  const toast = useToast();

  const allCourses = useMemo(
    () => [...(studentCoursesQuery.data ?? []), ...(trainingsQuery.data ?? [])],
    [studentCoursesQuery.data, trainingsQuery.data],
  );

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [amountEGP, setAmountEGP] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCourseChange(id: string) {
    setCourseId(id);
    const course = allCourses.find((c) => c.id === id);
    if (course) setAmountEGP(String(course.priceEGP));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(amountEGP);
    if (!studentId || !courseId || !amount || amount <= 0) return;
    try {
      await recordPayment.mutateAsync({
        studentId,
        courseId,
        amountEGP: amount,
        reference: reference || undefined,
      });
      toast.success("تم تسجيل الدفعة وتفعيل الاشتراك");
      setStudentId("");
      setCourseId("");
      setAmountEGP("");
      setReference("");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Card className="mb-6 p-4">
      <div className="mb-3 flex items-center gap-2">
        <HandCoins className="h-4 w-4 text-(--color-gold-dim)" />
        <h2 className="font-display text-base font-semibold text-(--color-navy)">
          تسجيل دفعة يدوية (فودافون كاش / تحويل)
        </h2>
      </div>
      <p className="mb-4 text-xs text-(--color-muted)">
        استخدمها بعد ما تتأكد إن الفلوس وصلتك فعليًا — بتفعّل اشتراك الطالب وتسجّل الدفعة مع بعض،
        عشان تظهر في الإحصائيات فوق. لو الاشتراك مجاني أو من غير مقابل، استخدم "تفعيل اشتراك يدوي"
        من صفحة الاشتراكات بدل كده.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Field label="الطالب">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">اختر طالب...</option>
              {(studentsQuery.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.phone}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="min-w-[200px] flex-1">
          <Field label="الكورس/الدورة">
            <Select value={courseId} onChange={(e) => handleCourseChange(e.target.value)}>
              <option value="">اختر كورس أو دورة...</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-32">
          <Field label="المبلغ (جنيه)">
            <Input
              type="number"
              min={1}
              value={amountEGP}
              onChange={(e) => setAmountEGP(e.target.value)}
            />
          </Field>
        </div>
        <div className="min-w-[180px] flex-1">
          <Field label="مرجع الدفعة" hint="اختياري — رقم المحول أو رقم العملية">
            <Input dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
        <Button
          type="submit"
          loading={recordPayment.isPending}
          disabled={!studentId || !courseId || !amountEGP}
        >
          تسجيل الدفعة وتفعيل الاشتراك
        </Button>
      </form>
      {error && (
        <div className="mt-2">
          <ErrorBanner message={error} />
        </div>
      )}
    </Card>
  );
}

export function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");

  const statsQuery = usePaymentsStatsAdmin();
  const paymentsQuery = usePaymentsAdmin({
    status: statusFilter || undefined,
  });

  const stats = statsQuery.data;

  return (
    <div>
      <PageHeader
        title="المدفوعات والإيرادات"
        description="كل عمليات الدفع عن طريق كاشير أو المسجّلة يدويًا، وإجمالي الإيرادات"
      />

      {statsQuery.isLoading && <LoadingState />}
      {statsQuery.error && <ErrorBanner message={extractErrorMessage(statsQuery.error)} />}

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Wallet} label="إجمالي الإيرادات" value={formatEGP(stats.totalRevenueEGP)} />
          <StatCard
            icon={TrendingUp}
            label="إيرادات آخر 30 يوم"
            value={formatEGP(stats.last30DaysRevenueEGP)}
          />
          <StatCard icon={CheckCircle2} label="مدفوعات ناجحة" value={stats.countsByStatus.PAID} />
          <StatCard icon={Clock} label="قيد الانتظار" value={stats.countsByStatus.PENDING} />
        </div>
      )}

      <RecordManualPaymentForm />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-(--color-navy)">سجل المدفوعات</h2>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "")}
          className="w-48"
        >
          <option value="">كل الحالات</option>
          <option value="PAID">مدفوعة</option>
          <option value="PENDING">قيد الانتظار</option>
          <option value="FAILED">فشلت</option>
          <option value="REFUNDED">مسترجعة</option>
        </Select>
      </div>

      <div className="mt-3">
        {paymentsQuery.isLoading && <LoadingState />}
        {paymentsQuery.error && <ErrorBanner message={extractErrorMessage(paymentsQuery.error)} />}

        {paymentsQuery.data && paymentsQuery.data.length === 0 && (
          <EmptyState
            title="لسه مفيش مدفوعات"
            description={statusFilter ? "مفيش مدفوعات بالحالة دي حاليًا." : "هتظهر هنا أول ما طالب يدفع."}
          />
        )}

        {paymentsQuery.data && paymentsQuery.data.length > 0 && (
          <Card className="divide-y divide-(--color-silver-light)">
            {paymentsQuery.data.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {payment.status === "FAILED" ? (
                    <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                  ) : (
                    <Wallet className="h-4 w-4 shrink-0 text-(--color-gold-dim)" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-(--color-navy)">
                      {payment.student?.name ?? "—"}
                    </div>
                    <div className="text-xs text-(--color-muted)">
                      {payment.course?.title ?? "—"} · {PROVIDER_LABEL[payment.provider]}
                      {payment.providerRef ? ` · ${payment.providerRef}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-(--color-navy)" dir="ltr">
                      {formatEGP(payment.amountEGP)}
                    </div>
                    <div className="text-xs text-(--color-muted)">
                      {new Date(payment.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[payment.status]}>{STATUS_LABEL[payment.status]}</Badge>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
