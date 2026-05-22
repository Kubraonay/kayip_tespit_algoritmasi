import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getRolePermissionsMatrix } from "@/lib/actions/rbac";
import { RolePermissionMatrix } from "@/components/yetki/role-permission-matrix";
import { KeyRound } from "lucide-react";
import Link from "next/link";

export default async function RollerPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "rol_yonetimi"))) {
    redirect("/dashboard/yetkisiz?from=/dashboard/yetki-yonetimi/roller");
  }

  const { matrix, error } = await getRolePermissionsMatrix();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <KeyRound className="h-7 w-7 text-sky-600" />
            Roller & Yetkiler
          </h2>
          <p className="text-slate-700">
            Rol bazlı yetki matrisini düzenleyin; değişiklikler denetim loguna
            yazılır.
          </p>
        </div>
        <Link
          href="/dashboard/yetki-yonetimi/kullanicilar"
          className="text-sm font-medium text-sky-600 hover:underline"
        >
          ← Kullanıcı Yönetimi
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {matrix && <RolePermissionMatrix initialMatrix={matrix} />}
    </div>
  );
}
