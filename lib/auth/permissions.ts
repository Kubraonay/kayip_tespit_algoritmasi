export type UserRole = "admin" | "muhendis" | "izleyici";

export const ROL_LABELS: Record<UserRole, string> = {
  admin: "Yönetici",
  muhendis: "Elektrik Mühendisi",
  izleyici: "İzleyici (Salt Okunur)",
};

export type PermissionKey =
  | "kullanici_yonetimi"
  | "veri_duzenleme"
  | "analiz_calistir"
  | "veri_aktar"
  | "rapor_goruntuleme";

export const PERMISSIONS: Record<PermissionKey, UserRole[]> = {
  kullanici_yonetimi: ["admin"],
  veri_duzenleme: ["admin", "muhendis"],
  analiz_calistir: ["admin", "muhendis"],
  veri_aktar: ["admin", "muhendis"],
  rapor_goruntuleme: ["admin", "muhendis", "izleyici"],
};

export function hasPermission(
  role: string | undefined,
  permission: PermissionKey
): boolean {
  if (!role) return false;
  return PERMISSIONS[permission].includes(role as UserRole);
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}
