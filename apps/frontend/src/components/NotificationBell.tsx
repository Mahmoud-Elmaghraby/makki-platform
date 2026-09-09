import { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = { items: NotificationItem[]; unreadCount: number };

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `من ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `من ${days} يوم`;
}

/**
 * جرس إشعارات عام بيتستخدم في لوحة الأدمن وبوابة الطالب مع بعض — الفرق
 * الوحيد بينهم هو الـ apiClient (كل بوابة عندها توكن مختلف) والـ basePath
 * (endpoint مختلف في الباك إند لكل جمهور: /notifications/admin أو
 * /notifications/me). الروابط (item.link) جاهزة من الباك إند بمسارها
 * الكامل الصحيح لكل بوابة، فمحتاجين بس نعمل عليها Link عادي.
 */
export function NotificationBell({
  apiClient,
  basePath,
  queryKey,
}: {
  apiClient: AxiosInstance;
  basePath: string;
  queryKey: string;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await apiClient.get<NotificationsResponse>(basePath)).data,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`${basePath}/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.patch(`${basePath}/read-all`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-(--color-navy) hover:bg-(--color-paper-alt)"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 w-80 max-w-[90vw] rounded-lg border border-(--color-silver-light) bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-(--color-silver-light) px-4 py-3">
              <span className="text-sm font-bold text-(--color-navy)">الإشعارات</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-(--color-gold-dim) hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-sm text-(--color-muted)">بيتم التحميل...</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-(--color-muted)">مفيش إشعارات لسه</div>
              ) : (
                items.map((item) => {
                  const content = (
                    <div
                      className={`flex flex-col gap-1 border-b border-(--color-silver-light) px-4 py-3 text-right last:border-0 ${
                        item.isRead ? "" : "bg-(--color-gold)/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-(--color-navy)">{item.title}</span>
                        {!item.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-(--color-gold)" />
                        )}
                      </div>
                      {item.body && (
                        <p className="text-xs leading-6 text-(--color-muted)">{item.body}</p>
                      )}
                      <span className="text-[11px] text-(--color-muted)">{timeAgo(item.createdAt)}</span>
                    </div>
                  );

                  return item.link ? (
                    <Link
                      key={item.id}
                      to={item.link}
                      onClick={() => {
                        if (!item.isRead) markRead.mutate(item.id);
                        setOpen(false);
                      }}
                      className="block hover:bg-(--color-paper-alt)"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => !item.isRead && markRead.mutate(item.id)}
                      className="block w-full hover:bg-(--color-paper-alt)"
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
