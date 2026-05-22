import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getUsersForManagement } from "@/lib/actions/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddUserForm } from "@/components/yetki/add-user-form";
import { UsersManagementTable } from "@/components/yetki/users-management-table";
import { UserCog, Shield } from "lucide-react";
import Link from "next/link";

export default async function KullanicilarPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "kullanici_yonetimi"))) {
    redirect("/dashboard/yetkisiz?from=/dashboard/yetki-yonetimi/kullanicilar");
  }

  const { users, error } = await getUsersForManagement();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
          <p className="text-slate-700">
            Kullanıcı oluşturma, rol atama ve erişim durumu
          </p>
        </div>
        <Link
          href="/dashboard/yetki-yonetimi/roller"
          className="text-sm font-medium text-sky-600 hover:underline"
        >
          Roller & Yetkiler →
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Yeni kullanıcı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Kullanıcılar ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsersManagementTable
            users={users ?? []}
            currentUserId={Number(session?.user?.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
