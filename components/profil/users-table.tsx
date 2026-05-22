"use client";

import { useRouter } from "next/navigation";
import { updateUserRole, deleteUser } from "@/lib/actions/users";
import { ROL_LABELS, type UserRole } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type UserRow = {
  id: number;
  email: string;
  adSoyad: string;
  rol: string;
  createdAt: Date | null;
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: number;
}) {
  const router = useRouter();

  async function onRoleChange(userId: number, rol: UserRole) {
    const res = await updateUserRole(userId, rol);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function onDelete(userId: number) {
    if (!confirm("Bu kullanıcı silinsin mi?")) return;
    const res = await deleteUser(userId);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-700">
            <th className="pb-3 pr-4">Ad Soyad</th>
            <th className="pb-3 pr-4">E-posta</th>
            <th className="pb-3 pr-4">Yetki</th>
            <th className="pb-3 pr-4">Kayıt</th>
            <th className="pb-3">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-slate-100">
              <td className="py-3 pr-4 font-medium">
                {u.adSoyad}
                {u.id === currentUserId && (
                  <Badge variant="info" className="ml-2">
                    Siz
                  </Badge>
                )}
              </td>
              <td className="py-3 pr-4 text-slate-700">{u.email}</td>
              <td className="py-3 pr-4">
                <select
                  value={u.rol}
                  onChange={(e) =>
                    onRoleChange(u.id, e.target.value as UserRole)
                  }
                  disabled={u.id === currentUserId && u.rol === "admin"}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="admin">Yönetici</option>
                  <option value="muhendis">Mühendis</option>
                  <option value="izleyici">İzleyici</option>
                </select>
              </td>
              <td className="py-3 pr-4 text-slate-700">
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString("tr-TR")
                  : "—"}
              </td>
              <td className="py-3">
                {u.id !== currentUserId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(u.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
