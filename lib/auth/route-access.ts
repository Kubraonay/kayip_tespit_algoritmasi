import type { PermissionKey } from "@/lib/auth/permissions";

/** En uzun prefix eşleşmesi için sıralı (spesifik önce) */
const ROUTE_PERMISSIONS: { prefix: string; permission: PermissionKey }[] = [
  { prefix: "/dashboard/yetki-yonetimi/kullanicilar", permission: "kullanici_yonetimi" },
  { prefix: "/dashboard/yetki-yonetimi/roller", permission: "rol_yonetimi" },
  { prefix: "/dashboard/yetki-yonetimi", permission: "kullanici_yonetimi" },
  { prefix: "/dashboard/veri-aktar", permission: "veri_aktar" },
  { prefix: "/dashboard/loglar", permission: "log_goruntuleme" },
  { prefix: "/dashboard/bilgilendirme", permission: "bilgilendirme_goruntuleme" },
  { prefix: "/dashboard/kacak-tespit", permission: "kacak_goruntuleme" },
  { prefix: "/dashboard/analiz", permission: "analiz_calistir" },
  { prefix: "/dashboard/alarm-merkezi", permission: "alarm_goruntuleme" },
  { prefix: "/dashboard/bildirimler", permission: "alarm_goruntuleme" },
  { prefix: "/dashboard/saha-operasyonlari", permission: "saha_goruntuleme" },
  { prefix: "/dashboard/sebeke", permission: "veri_duzenleme" },
  { prefix: "/dashboard/sayaclar", permission: "rapor_goruntuleme" },
  { prefix: "/dashboard/aboneler", permission: "rapor_goruntuleme" },
  { prefix: "/dashboard/yetkisiz", permission: "rapor_goruntuleme" },
  { prefix: "/dashboard", permission: "rapor_goruntuleme" },
];

export function getRequiredPermission(pathname: string): PermissionKey | null {
  if (!pathname.startsWith("/dashboard")) return null;
  if (pathname === "/dashboard/yetkisiz") return null;
  if (
    pathname === "/dashboard/profil" ||
    pathname.startsWith("/dashboard/profil/")
  ) {
    return null;
  }
  const match = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  return match?.permission ?? "rapor_goruntuleme";
}
