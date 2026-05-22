import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  isAdmin,
  ROL_LABELS,
  PERMISSIONS,
  type UserRole,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddUserForm } from "@/components/profil/add-user-form";
import { UsersTable } from "@/components/profil/users-table";
import { UserCircle, Shield, KeyRound } from "lucide-react";

const PERM_LABELS: Record<PermissionKey, string> = {
  kullanici_yonetimi: "Kullanıcı yönetimi",
  veri_duzenleme: "Veri düzenleme (abone, sayaç, şebeke)",
  analiz_calistir: "Kayıp kaçak analizi çalıştırma",
  veri_aktar: "CSV veri aktarımı",
  rapor_goruntuleme: "Rapor ve dashboard görüntüleme",
};

export default async function ProfilPage() {
  const session = await auth();
  const role = session?.user?.role;
  const admin = isAdmin(role);
  const db = getDb();
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      adSoyad: users.adSoyad,
      rol: users.rol,
      createdAt: users.createdAt,
    })
    .from(users);

  const rolLabel =
    role && role in ROL_LABELS ? ROL_LABELS[role as UserRole] : role;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Profil ve Yetkiler</h2>
        <p className="text-slate-700">
          Hesap bilgileriniz ve kullanıcı yönetimi
        </p>
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
              <Badge variant={admin ? "info" : "default"} className="mt-2">
                {rolLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Oturumunuz güvenli şekilde yönetilmektedir. Şifre değişikliği için
            yöneticinize başvurun.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Yetki Matrisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-700">
                <th className="pb-2 pr-4">İşlem</th>
                <th className="pb-2 pr-4 text-center">Yönetici</th>
                <th className="pb-2 pr-4 text-center">Mühendis</th>
                <th className="pb-2 text-center">İzleyici</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(PERMISSIONS) as PermissionKey[]).map((key) => (
                <tr key={key} className="border-b border-slate-50">
                  <td className="py-2 pr-4">{PERM_LABELS[key]}</td>
                  {(["admin", "muhendis", "izleyici"] as UserRole[]).map(
                    (r) => (
                      <td key={r} className="py-2 text-center">
                        {PERMISSIONS[key].includes(r) ? (
                          <span className="text-emerald-600">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-slate-700">
            Mevcut rolünüz: <strong>{rolLabel}</strong>
          </p>
        </CardContent>
      </Card>

      {admin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Yeni Kullanıcı Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddUserForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kullanıcılar ({allUsers.length})</CardTitle>
              <p className="text-sm text-slate-700">
                Yetkileri açılır listeden güncelleyebilirsiniz
              </p>
            </CardHeader>
            <CardContent>
              <UsersTable
                users={allUsers}
                currentUserId={Number(session?.user?.id)}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-6 text-sm text-amber-900">
            Kullanıcı ekleme ve yetki düzenleme yalnızca yönetici hesapları
            tarafından yapılabilir.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
