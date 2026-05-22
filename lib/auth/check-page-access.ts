import { hasPermission } from "@/lib/db/queries-rbac";
import { kayitIslemLog } from "@/lib/audit/log";
import { getRequiredPermission } from "@/lib/auth/route-access";
import type { PermissionKey } from "@/lib/auth/permissions";

export async function checkPageAccess(
  pathname: string,
  role: string | undefined,
  userId?: number,
  userName?: string | null
): Promise<{ allowed: boolean; permission?: PermissionKey }> {
  const permission = getRequiredPermission(pathname);
  if (!permission) return { allowed: true };
  const allowed = await hasPermission(role, permission);
  if (!allowed && userId) {
    await kayitIslemLog({
      kullaniciId: userId,
      kullaniciAd: userName,
      islemTipi: "erisim_reddedildi",
      aciklama: `${userName ?? "Kullanıcı"} yetkisiz erişim: ${pathname}`,
      detay: JSON.stringify({ pathname, permission, rol: role }),
    });
  }
  return { allowed, permission };
}
