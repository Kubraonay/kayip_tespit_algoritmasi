"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateRolePermissions,
  resetRolePermissionsToDefault,
} from "@/lib/actions/rbac";
import {
  ALL_PERMISSIONS,
  PERM_LABELS,
  ROL_LABELS,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { USER_ROLES, type UserRole } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RolePermissionMatrix({
  initialMatrix,
}: {
  initialMatrix: Record<string, Record<string, boolean>>;
}) {
  const router = useRouter();
  const [matrix, setMatrix] = useState(initialMatrix);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(rol: UserRole, yetki: PermissionKey) {
    setMatrix((m) => ({
      ...m,
      [rol]: { ...m[rol], [yetki]: !m[rol]?.[yetki] },
    }));
  }

  async function save() {
    setLoading(true);
    setMessage(null);
    const perms = matrix[selectedRole] as Record<PermissionKey, boolean>;
    const res = await updateRolePermissions(selectedRole, perms);
    setLoading(false);
    if (res.error) setMessage(res.error);
    else {
      setMessage("Yetkiler kaydedildi");
      router.refresh();
    }
  }

  async function resetDefault() {
    if (!confirm(`${ROL_LABELS[selectedRole]} için varsayılan yetkiler yüklensin mi?`))
      return;
    setLoading(true);
    const res = await resetRolePermissionsToDefault(selectedRole);
    setLoading(false);
    if (res.error) setMessage(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {USER_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelectedRole(r)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              selectedRole === r
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {ROL_LABELS[r]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ROL_LABELS[selectedRole]} — Yetkiler</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {ALL_PERMISSIONS.map((yetki) => (
              <li
                key={yetki}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <span className="text-sm text-slate-800">
                  {PERM_LABELS[yetki]}
                </span>
                <input
                  type="checkbox"
                  checked={!!matrix[selectedRole]?.[yetki]}
                  onChange={() => toggle(selectedRole, yetki)}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={save} disabled={loading}>
              {loading ? "Kaydediliyor…" : "Kaydet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetDefault}
              disabled={loading}
            >
              Varsayılana sıfırla
            </Button>
          </div>
          {message && (
            <p className="mt-3 text-sm text-slate-700">{message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tüm roller özeti</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-slate-600">
                <th className="pb-2 pr-2">Yetki</th>
                {USER_ROLES.map((r) => (
                  <th key={r} className="pb-2 px-1 text-center">
                    {ROL_LABELS[r].slice(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((yetki) => (
                <tr key={yetki} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2">{PERM_LABELS[yetki]}</td>
                  {USER_ROLES.map((r) => (
                    <td key={r} className="py-1.5 text-center">
                      {matrix[r]?.[yetki] ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
