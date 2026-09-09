import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  LoadingState,
  ErrorBanner,
  EmptyState,
  Input,
} from "../components/ui";
import { UserFormModal } from "../components/UserFormModal";
import { useUsers, useDeleteUser } from "../hooks/useUsers";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { useToast } from "../components/ToastContext";
import { extractErrorMessage } from "../lib/apiClient";
import type { Role, StaffUser } from "../types/api";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "أدمن",
  MANAGER: "مدير",
  INSTRUCTOR: "مدرب",
};

const ROLE_TONE: Record<Role, "gold" | "neutral" | "success"> = {
  ADMIN: "gold",
  MANAGER: "neutral",
  INSTRUCTOR: "success",
};

/**
 * إدارة موحّدة لكل حسابات الطاقم (أدمن/مدير/مدرب) — قبل الصفحة دي، الطريقة
 * الوحيدة لإنشاء حساب أدمن أو مدير كانت سكربت تقني (seed-admin.ts)، ومفيش
 * مكان في الواجهة أصلاً كان بيوصّل لموديول "المستخدمين" ده رغم إن الباك إند
 * بتاعه كان جاهز بالكامل.
 */
export function UsersPage() {
  const { user: currentUser } = useAdminAuth();
  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ user?: StaffUser } | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return users;
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        ROLE_LABEL[user.role].includes(query)
      );
    });
  }, [users, search]);

  async function handleDelete(user: StaffUser) {
    if (!confirm(`متأكد إنك عايز تمسح حساب "${user.name}"؟ الإجراء ده مينفعش يترجع فيه.`)) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("تم حذف الحساب");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="المستخدمين"
        description="حسابات الطاقم اللي بتدخل لوحة الأدمن — أدمن، مدير، أو مدرب"
        actions={
          <Button onClick={() => setModal({})}>
            <Plus className="h-4 w-4" />
            مستخدم جديد
          </Button>
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorBanner message={extractErrorMessage(error)} />}

      {users && users.length === 0 && <EmptyState title="لسه مفيش مستخدمين مضافين" />}

      {users && users.length > 0 && (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني أو الدور..."
              className="pr-9"
            />
          </div>

          {filteredUsers && filteredUsers.length === 0 && (
            <EmptyState title="مفيش نتائج مطابقة للبحث" />
          )}

          {filteredUsers && filteredUsers.length > 0 && (
            <Card className="divide-y divide-(--color-silver-light)">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <div key={user.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-(--color-navy)">
                            {user.name}
                          </span>
                          <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                          {isSelf && (
                            <span className="text-xs text-(--color-muted)">(حسابك)</span>
                          )}
                        </div>
                        <div className="text-xs text-(--color-muted)" dir="ltr">
                          {user.email}
                        </div>
                        {user.instructor && (
                          <div className="mt-0.5 text-xs text-(--color-muted)">
                            بيدرّس {user.instructor._count.courses} كورس/دورة
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal({ user })}
                        title="تعديل"
                        className="rounded-lg p-2 text-(--color-muted) hover:bg-(--color-paper-alt) hover:text-(--color-navy)"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={isSelf}
                        title={isSelf ? "متقدرش تمسح حسابك انت شخصيًا" : "حذف"}
                        className="rounded-lg p-2 text-(--color-muted) hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-(--color-muted)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}

      {modal && (
        <UserFormModal open onClose={() => setModal(null)} user={modal.user} />
      )}
    </div>
  );
}
