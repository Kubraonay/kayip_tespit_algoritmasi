import Link from "next/link";
import { auth } from "@/lib/auth/config";
import {
  ROL_LABELS,
  PERM_LABELS,
  type UserRole,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { getRolePermissions, hasPermission } from "@/lib/db/queries-rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, KeyRound, Shield } from "lucide-react";

export default async function ProfilPage() {
  const session = await auth();
  const role = session?.user?.role;
  const rolLabel =
    role && role in ROL_LABELS ? ROL_LABELS[role as UserRole] : role;
  const myPerms = role ? await getRolePermissions(role) : [];
  const canManageUsers = await hasPermission(role, "kullanici_yonetimi");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Profil</h2>
        <p className="text-slate-700">Hesap bilgileriniz ve yetki özeti</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
              <UserCircle className="h-8 w-8 text-sky-600" />
            </div>
            <div>
              <CardTitle>{session?.user?.name}</CardTitle>
              <p className="text-sm text-slate-700">{session?.user?.email}</p>
              <Badge variant="info" className="mt-2">
                {rolLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Oturumunuz güvenli şekilde yönetilmektedir. Şifre değişikliği için
            sistem yöneticinize başvurun.
          </p>
          {canManageUsers && (
            <Link
              href="/dashboard/yetki-yonetimi/kullanicilar"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:underline"
            >
              <Shield className="h-4 w-4" />
              Kullanıcı Yönetimi
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Yetkilerim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {myPerms.map((key) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm text-slate-800"
              >
                <span className="text-emerald-600">✓</span>
                {PERM_LABELS[key as PermissionKey]}
              </li>
            ))}
          </ul>
          {myPerms.length === 0 && (
            <p className="text-sm text-slate-600">Tanımlı yetki bulunamadı.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
