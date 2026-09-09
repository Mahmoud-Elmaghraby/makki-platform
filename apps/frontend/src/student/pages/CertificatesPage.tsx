import { Award, Download } from "lucide-react";
import { useCertificateDownloadUrl, useMyCertificates } from "../hooks/useCertificates";
import { Button, Card, EmptyState, ErrorBanner, LoadingState, PageHeader } from "../../admin/components/ui";
import { extractErrorMessage } from "../lib/apiClient";

export function CertificatesPage() {
  const { data: certificates, isLoading, isError, error } = useMyCertificates();
  const downloadUrl = useCertificateDownloadUrl();

  function handleDownload(certificateId: string) {
    downloadUrl.mutate(certificateId, {
      onSuccess: (url) => window.open(url, "_blank", "noopener"),
    });
  }

  return (
    <div>
      <PageHeader title="شهاداتي" description="شهادات الإتمام اللي صدرت لك" />

      {isLoading && <LoadingState label="بيتم تحميل الشهادات..." />}
      {isError && <ErrorBanner message={extractErrorMessage(error)} />}

      {certificates && certificates.length === 0 && (
        <EmptyState
          title="لسه مفيش شهادات"
          description="لما تخلّص كورس بالكامل (كل الدروس والامتحانات)، الشهادة هتظهر هنا تلقائيًا."
        />
      )}

      {certificates && certificates.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--color-gold)/15">
                <Award className="h-6 w-6 text-(--color-gold-dim)" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-base font-semibold text-(--color-navy)">
                  {certificate.course.title}
                </h3>
                <p className="text-xs text-(--color-muted)">
                  رقم الشهادة: {certificate.serialNumber}
                </p>
                <p className="text-xs text-(--color-muted)">
                  {new Date(certificate.issuedAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={downloadUrl.isPending}
                onClick={() => handleDownload(certificate.id)}
              >
                <Download className="h-4 w-4" />
                تحميل
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
