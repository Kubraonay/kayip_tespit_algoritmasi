"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { users, USER_ROLES, type UserRole } from "@/lib/db/schema";
import { rolYetkileri } from "@/lib/db/schema";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/db/queries-rbac";
import { kayitIslemLog } from "@/lib/audit/log";
import { z } from "zod";

async function requirePerm(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user?.role) {
    return { error: "Oturum gerekli" as const };
  }
  if (!(await hasPermission(session.user.role, permission))) {
    return { error: "Bu işlem için yetkiniz yok" as const };
  }
  return { session };
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  adSoyad: z.string().min(2),
  rol: z.enum(USER_ROLES),
});

export async function getUsersForManagement() {
  const check = await requirePerm("kullanici_yonetimi");
  if ("error" in check) return { error: check.error, users: [] };
  const db = getDb();
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      adSoyad: users.adSoyad,
      rol: users.rol,
      aktif: users.aktif,
      sonGirisAt: users.sonGirisAt,
      createdAt: users.createdAt,
    })
    .from(users);
  return { users: list };
}

export async function createUser(formData: FormData) {
  const check = await requirePerm("kullanici_yonetimi");
  if ("error" in check) return { error: check.error };

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    adSoyad: formData.get("adSoyad"),
    rol: formData.get("rol"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing.length > 0) return { error: "Bu e-posta zaten kayıtlı" };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: hash,
      adSoyad: parsed.data.adSoyad,
      rol: parsed.data.rol,
      aktif: true,
    })
    .returning();

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "kullanici_olusturuldu",
    varlikTipi: "kullanici",
    varlikId: created.id,
    aciklama: `Yeni kullanıcı: ${parsed.data.adSoyad}`,
    detay: JSON.stringify({ email: parsed.data.email, rol: parsed.data.rol }),
  });

  revalidatePath("/dashboard/yetki-yonetimi/kullanicilar");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function updateUser(
  userId: number,
  data: { adSoyad?: string; email?: string; rol?: UserRole; aktif?: boolean }
) {
  const check = await requirePerm("kullanici_yonetimi");
  if ("error" in check) return { error: check.error };

  const db = getDb();
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { error: "Kullanıcı bulunamadı" };

  if (
    Number(check.session.user.id) === userId &&
    data.rol &&
    data.rol !== "admin"
  ) {
    return { error: "Kendi admin yetkinizi kaldıramazsınız" };
  }

  await db
    .update(users)
    .set({
      ...(data.adSoyad !== undefined && { adSoyad: data.adSoyad }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.rol !== undefined && { rol: data.rol }),
      ...(data.aktif !== undefined && { aktif: data.aktif }),
    })
    .where(eq(users.id, userId));

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: data.aktif === false ? "kullanici_devre_disı" : "kullanici_guncellendi",
    varlikTipi: "kullanici",
    varlikId: userId,
    aciklama: `Kullanıcı güncellendi: ${target.adSoyad}`,
    detay: JSON.stringify({ eski: target, yeni: data }),
  });

  revalidatePath("/dashboard/yetki-yonetimi/kullanicilar");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function updateUserRole(userId: number, rol: UserRole) {
  return updateUser(userId, { rol });
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const check = await requirePerm("kullanici_yonetimi");
  if ("error" in check) return { error: check.error };
  if (newPassword.length < 8) return { error: "Şifre en az 8 karakter olmalı" };

  const db = getDb();
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { error: "Kullanıcı bulunamadı" };

  const hash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.id, userId));

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "kullanici_sifre_sifirlandi",
    varlikTipi: "kullanici",
    varlikId: userId,
    aciklama: `Şifre sıfırlandı: ${target.adSoyad}`,
  });

  revalidatePath("/dashboard/yetki-yonetimi/kullanicilar");
  return { success: true };
}

export async function deleteUser(userId: number) {
  const check = await requirePerm("kullanici_yonetimi");
  if ("error" in check) return { error: check.error };
  if (Number(check.session.user.id) === userId) {
    return { error: "Kendi hesabınızı silemezsiniz" };
  }

  const db = getDb();
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  await db.delete(users).where(eq(users.id, userId));

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "kullanici_silindi",
    varlikTipi: "kullanici",
    varlikId: userId,
    aciklama: `Kullanıcı silindi: ${target?.adSoyad}`,
    detay: JSON.stringify({ email: target?.email }),
  });

  revalidatePath("/dashboard/yetki-yonetimi/kullanicilar");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function getRolePermissionsMatrix() {
  const check = await requirePerm("rol_yonetimi");
  if ("error" in check) return { error: check.error, matrix: null };

  const db = getDb();
  const rows = await db.select().from(rolYetkileri);
  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[];
  const matrix: Record<string, Record<string, boolean>> = {};

  for (const rol of roles) {
    matrix[rol] = {};
    for (const yetki of ALL_PERMISSIONS) {
      const row = rows.find((r) => r.rol === rol && r.yetki === yetki);
      matrix[rol][yetki] = row
        ? row.aktif
        : DEFAULT_ROLE_PERMISSIONS[rol].includes(yetki);
    }
  }
  return { matrix };
}

export async function updateRolePermissions(
  rol: UserRole,
  permissions: Record<PermissionKey, boolean>
) {
  const check = await requirePerm("rol_yonetimi");
  if ("error" in check) return { error: check.error };

  const db = getDb();
  await db.delete(rolYetkileri).where(eq(rolYetkileri.rol, rol));
  for (const yetki of ALL_PERMISSIONS) {
    const aktif = permissions[yetki] ?? false;
    if (aktif) {
      await db.insert(rolYetkileri).values({ rol, yetki, aktif: true });
    }
  }

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "rol_yetki_guncellendi",
    varlikTipi: "rol",
    aciklama: `${ROL_LABELS_SAFE(rol)} rol yetkileri güncellendi`,
    detay: JSON.stringify(permissions),
  });

  revalidatePath("/dashboard/yetki-yonetimi/roller");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

function ROL_LABELS_SAFE(rol: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    yonetici: "Yönetici",
    operator: "Operatör",
    saha_personeli: "Saha Personeli",
    izleyici: "İzleyici",
  };
  return labels[rol];
}

export async function resetRolePermissionsToDefault(rol: UserRole) {
  const check = await requirePerm("rol_yonetimi");
  if ("error" in check) return { error: check.error };

  const db = getDb();
  await db.delete(rolYetkileri).where(eq(rolYetkileri.rol, rol));
  for (const yetki of DEFAULT_ROLE_PERMISSIONS[rol]) {
    await db.insert(rolYetkileri).values({ rol, yetki, aktif: true });
  }

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "rol_yetki_varsayilan",
    varlikTipi: "rol",
    aciklama: `${ROL_LABELS_SAFE(rol)} varsayılan yetkilere sıfırlandı`,
  });

  revalidatePath("/dashboard/yetki-yonetimi/roller");
  return { success: true };
}
