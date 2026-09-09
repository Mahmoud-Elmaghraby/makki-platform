import { useState } from "react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import {
  Card,
  PageHeader,
  LoadingState,
  ErrorBanner,
  EmptyState,
  Badge,
  Select,
} from "../components/ui";
import { useConsultations, useUpdateConsultationStatus } from "../hooks/useConsultations";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { ConsultationStatus, ConsultationType } from "../types/api";

const TYPE_LABEL: Record<ConsultationType, string> = {
  LEGAL_CONSULTATION: "استشارة قانونية",
  COURSE_INQUIRY: "استفسار عن كورس",
  TRAINING_INQUIRY: "استفسار عن دورة تدريبية",
};

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  CLOSED: "مغلق",
};

const STATUS_TONE: Record<ConsultationStatus, "neutral" | "success" | "warning" | "danger"> = {
  NEW: "warning",
  CONTACTED: "success",
  CLOSED: "neutral",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

export function ConsultationsPage() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState<ConsultationType | "">("");
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | "">("");

  const { data: requests, isLoading, error } = useConsultations({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });
  const updateStatus = useUpdateConsultationStatus();

  async function handleStatusChange(id: string, status: ConsultationStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("تم تحديث حالة الطلب");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="طلبات التواصل"
        description="طلبات الاستشارات والاستفسارات عن الكورسات والدورات اللي وصلت من صفحة (تواصل معنا) في الموقع"
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ConsultationType | "")}
          className="w-auto"
        >
          <option value="">كل الأنواع</option>
          {(Object.keys(TYPE_LABEL) as ConsultationType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ConsultationStatus | "")}
          className="w-auto"
        >
          <option value="">كل الحالات</option>
          {(Object.keys(STATUS_LABEL) as ConsultationStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorBanner message={extractErrorMessage(error)} />}
      {requests && requests.length === 0 && (
        <EmptyState title="مفيش طلبات تواصل مطابقة" />
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    <span className="text-xs font-medium text-(--color-gold-dim)">
                      {TYPE_LABEL[r.type]}
                    </span>
                    <span className="text-xs text-(--color-muted)">{formatDate(r.createdAt)}</span>
                  </div>
                  <h3 className="font-bold text-(--color-navy)">{r.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-muted)">
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone className="h-3.5 w-3.5" />
                      {r.phone}
                    </span>
                    {r.email && (
                      <span className="flex items-center gap-1" dir="ltr">
                        <Mail className="h-3.5 w-3.5" />
                        {r.email}
                      </span>
                    )}
                  </div>
                  {r.subject && (
                    <p className="mt-2 text-sm font-medium text-(--color-navy)">{r.subject}</p>
                  )}
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-(--color-ink)/80">
                    <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--color-muted)" />
                    {r.message}
                  </p>
                </div>
                <Select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as ConsultationStatus)}
                  className="w-auto shrink-0"
                >
                  {(Object.keys(STATUS_LABEL) as ConsultationStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
