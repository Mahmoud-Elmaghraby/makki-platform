import { useMemo, useState } from "react";
import { Award, Search } from "lucide-react";
import { Card, PageHeader, LoadingState, ErrorBanner, EmptyState, Input } from "../components/ui";
import { useCertificatesAdmin } from "../hooks/useCertificates";
import { extractErrorMessage } from "../lib/apiClient";

export function CertificatesPage() {
  const { data: certificates, isLoading, error } = useCertificatesAdmin();
  const [search, setSearch] = useState("");

  const filteredCertificates = useMemo(() => {
    if (!certificates) return certificates;
    const query = search.trim().toLowerCase();
    if (!query) return certificates;
    return certificates.filter((certificate) => {
      return (
        (certificate.student?.name ?? "").toLowerCase().includes(query) ||
        (certificate.course?.title ?? "").toLowerCase().includes(query) ||
        certificate.serialNumber.toLowerCase().includes(query)
      );
    });
  }, [certificates, search]);

  return (
    <div>
      <PageHeader title="الشهادات" description="كل الشهادات اللي اتصدرت للطلاب بعد إتمام الكورسات" />

      {isLoading && <LoadingState />}
      {error && <ErrorBanner message={extractErrorMessage(error)} />}

      {certificates && certificates.length === 0 && (
        <EmptyState title="لسه مفيش شهادات اتصدرت" />
      )}

      {certificates && certificates.length > 0 && (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الطالب أو الكورس أو الرقم التسلسلي..."
              className="pr-9"
            />
          </div>

          {filteredCertificates && filteredCertificates.length === 0 && (
            <EmptyState title="مفيش نتائج مطابقة للبحث" />
          )}

          {filteredCertificates && filteredCertificates.length > 0 && (
            <Card className="divide-y divide-(--color-silver-light)">
              {filteredCertificates.map((certificate) => (
                <div key={certificate.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-(--color-gold-dim)" />
                    <div>
                      <div className="text-sm font-medium text-(--color-navy)">
                        {certificate.student?.name}
                      </div>
                      <div className="text-xs text-(--color-muted)">{certificate.course?.title}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium text-(--color-navy)" dir="ltr">
                      {certificate.serialNumber}
                    </div>
                    <div className="text-xs text-(--color-muted)">
                      {new Date(certificate.issuedAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
