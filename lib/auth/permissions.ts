import type { UserRole } from "@/lib/db/schema";

export type { UserRole };

export const ROL_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  yonetici: "Yönetici",
  operator: "Operatör",
  saha_personeli: "Saha Personeli",
  izleyici: "İzleyici",
};

/** RBAC öncesi JWT/DB rol anahtarları */
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  muhendis: "operator",
};

export function normalizeUserRole(
  role: string | undefined
): UserRole | undefined {
  if (!role) return undefined;
  if (role in ROL_LABELS) return role as UserRole;
  return LEGACY_ROLE_MAP[role];
}

export type PermissionKey =
  | "kullanici_yonetimi"
  | "rol_yonetimi"
  | "veri_duzenleme"
  | "analiz_calistir"
  | "veri_aktar"
  | "rapor_goruntuleme"
  | "saha_yonetimi"
  | "saha_goruntuleme"
  | "alarm_goruntuleme"
  | "alarm_yonetimi"
  | "log_goruntuleme"
  | "kacak_goruntuleme"
  | "bilgilendirme_goruntuleme";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "kullanici_yonetimi",
  "rol_yonetimi",
  "veri_duzenleme",
  "analiz_calistir",
  "veri_aktar",
  "rapor_goruntuleme",
  "saha_yonetimi",
  "saha_goruntuleme",
  "alarm_goruntuleme",
  "alarm_yonetimi",
  "log_goruntuleme",
  "kacak_goruntuleme",
  "bilgilendirme_goruntuleme",
];

export const PERM_LABELS: Record<PermissionKey, string> = {
  kullanici_yonetimi: "Kullanıcı yönetimi",
  rol_yonetimi: "Rol ve yetki yönetimi",
  veri_duzenleme: "Veri düzenleme (abone, sayaç, şebeke)",
  analiz_calistir: "Kayıp kaçak analizi çalıştırma",
  veri_aktar: "CSV veri aktarımı",
  rapor_goruntuleme: "Rapor ve dashboard görüntüleme",
  saha_yonetimi: "Saha operasyonları yönetimi",
  saha_goruntuleme: "Saha operasyonları görüntüleme",
  alarm_goruntuleme: "Alarm ve bildirim görüntüleme",
  alarm_yonetimi: "Alarm yönetimi ve tarama",
  log_goruntuleme: "İşlem ve denetim logları",
  kacak_goruntuleme: "Kaçak tespit görüntüleme",
  bilgilendirme_goruntuleme: "Bilgilendirme sayfası",
};

/** Varsayılan rol–yetki matrisi (migrate seed ve sıfırlama için) */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [...ALL_PERMISSIONS],
  yonetici: [
    "veri_duzenleme",
    "analiz_calistir",
    "veri_aktar",
    "rapor_goruntuleme",
    "saha_yonetimi",
    "saha_goruntuleme",
    "alarm_goruntuleme",
    "alarm_yonetimi",
    "log_goruntuleme",
    "kacak_goruntuleme",
    "bilgilendirme_goruntuleme",
  ],
  operator: [
    "veri_duzenleme",
    "analiz_calistir",
    "veri_aktar",
    "rapor_goruntuleme",
    "saha_yonetimi",
    "saha_goruntuleme",
    "alarm_goruntuleme",
    "alarm_yonetimi",
    "kacak_goruntuleme",
    "bilgilendirme_goruntuleme",
  ],
  saha_personeli: [
    "rapor_goruntuleme",
    "saha_goruntuleme",
    "saha_yonetimi",
    "kacak_goruntuleme",
  ],
  izleyici: [
    "rapor_goruntuleme",
    "kacak_goruntuleme",
    "alarm_goruntuleme",
    "saha_goruntuleme",
    "bilgilendirme_goruntuleme",
  ],
};

/** @deprecated DB matrisi kullanın; geriye dönük uyumluluk */
export const PERMISSIONS: Record<PermissionKey, UserRole[]> = Object.fromEntries(
  ALL_PERMISSIONS.map((key) => [
    key,
    (Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[]).filter((r) =>
      DEFAULT_ROLE_PERMISSIONS[r].includes(key)
    ),
  ])
) as Record<PermissionKey, UserRole[]>;

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function hasPermissionInList(
  perms: PermissionKey[],
  permission: PermissionKey
): boolean {
  return perms.includes(permission);
}
