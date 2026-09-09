import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { usePaymentStatus } from "../hooks/usePayments";
import { Button, Card, ErrorBanner, LoadingState, Spinner } from "../../admin/components/ui";
import { extractErrorMessage } from "../lib/apiClient";

// صفحة رجوع الطالب من بوابة الدفع (Kashier). دي بس للعرض — تفعيل الاشتراك
// الفعلي بيحصل من الـ webhook في الباك إند، مش من هنا، فلو الطالب قفل
// المتصفح بعد الدفع مباشرة برضه اشتراكه هيتفعّل عادي.
export function PaymentStatusPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { data, isLoading, isError, error } = usePaymentStatus(paymentId);

  if (isLoading) return <LoadingState label="بيتم التأكد من حالة الدفع..." />;
  if (isError) return <ErrorBanner message={extractErrorMessage(error)} />;
  if (!data) return null;

  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      {data.status === "PENDING" && (
        <>
          <Spinner className="h-8 w-8 text-(--color-royal-light)" />
          <h1 className="font-display text-lg font-semibold text-(--color-navy)">
            جاري تأكيد الدفع...
          </h1>
          <p className="text-sm text-(--color-muted)">
            ده بياخد كام ثانية عادةً. الصفحة هتحدّث نفسها لوحدها.
          </p>
        </>
      )}

      {data.status === "PAID" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <h1 className="font-display text-lg font-semibold text-(--color-navy)">تم الدفع بنجاح</h1>
          <p className="text-sm text-(--color-muted)">اشتراكك اتفعّل — يلا ابدأ الكورس.</p>
          <Link to="/student">
            <Button>روح لـ "كورساتي"</Button>
          </Link>
        </>
      )}

      {data.status === "FAILED" && (
        <>
          <XCircle className="h-10 w-10 text-red-500" />
          <h1 className="font-display text-lg font-semibold text-(--color-navy)">
            الدفع لم يتم
          </h1>
          <p className="text-sm text-(--color-muted)">حصلت مشكلة في عملية الدفع، جرّب تاني.</p>
          <Link to="/student">
            <Button variant="secondary">الرجوع لكورساتي</Button>
          </Link>
        </>
      )}

      {data.status === "REFUNDED" && (
        <>
          <Clock3 className="h-10 w-10 text-(--color-muted)" />
          <h1 className="font-display text-lg font-semibold text-(--color-navy)">
            تم استرداد المبلغ
          </h1>
        </>
      )}
    </Card>
  );
}
