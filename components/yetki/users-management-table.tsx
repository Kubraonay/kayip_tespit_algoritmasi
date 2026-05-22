"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateUser,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from "@/lib/actions/rbac";
import { ROL_LABELS } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/db/schema";
import { USER_ROLES } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, KeyRound } from "lucide-react";

type UserRow = {
  id: number;
  email: string;
  adSoyad: string;
  rol: string;
  aktif: boolean | null;
  sonGirisAt: Date | null;
  createdAt: Date | null;
};

export function UsersManagementTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [pwdUserId, setPwdUserId] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState("");

  async function onRoleChange(userId: number, rol: UserRole) {
    const res = await updateUserRole(userId, rol);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function onActiveToggle(userId: number, aktif: boolean) {
    const res = await updateUser(userId, { aktif });
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function onResetPassword(userId: number) {
    if (!newPwd || newPwd.length < 8) {
      alert("Şifre en az 8 karakter olmalı");
      return;
    }
    const res = await resetUserPassword(userId, newPwd);
    if (res.error) alert(res.error);
    else {
      setPwdUserId(null);
      setNewPwd("");
      router.refresh();
    }
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
            <th className="pb-3 pr-4">Rol</th>
            <th className="pb-3 pr-4">Durum</th>
            <th className="pb-3 pr-4">Son giriş</th>
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
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROL_LABELS[r]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 pr-4">
                <button
                  type="button"
                  onClick={() => onActiveToggle(u.id, !u.aktif)}
                  disabled={u.id === currentUserId}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.aktif !== false
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {u.aktif !== false ? "Aktif" : "Pasif"}
                </button>
              </td>
              <td className="py-3 pr-4 text-slate-700">
                {u.sonGirisAt
                  ? new Date(u.sonGirisAt).toLocaleString("tr-TR")
                  : "—"}
              </td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPwdUserId(pwdUserId === u.id ? null : u.id)
                    }
                    title="Şifre sıfırla"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  {u.id !== currentUserId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(u.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {pwdUserId === u.id && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="password"
                      placeholder="Yeni şifre"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="max-w-[140px]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onResetPassword(u.id)}
                    >
                      Kaydet
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
