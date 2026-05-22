"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAdmin, type UserRole } from "@/lib/auth/permissions";
import { kayitIslemLog } from "@/lib/audit/log";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { error: "Bu işlem için yönetici yetkisi gerekli" as const };
  }
  return { session };
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  adSoyad: z.string().min(2),
  rol: z.enum(["admin", "muhendis", "izleyici"]),
});

export async function getUsersList() {
  const check = await requireAdmin();
  if ("error" in check) return { error: check.error, users: [] };
  const db = getDb();
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      adSoyad: users.adSoyad,
      rol: users.rol,
      createdAt: users.createdAt,
    })
    .from(users);
  return { users: list };
}

export async function createUserByAdmin(formData: FormData) {
  const check = await requireAdmin();
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
  if (existing.length > 0) {
    return { error: "Bu e-posta zaten kayıtlı" };
  }

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: hash,
      adSoyad: parsed.data.adSoyad,
      rol: parsed.data.rol,
    })
    .returning();

  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "kullanici_olusturuldu",
    varlikTipi: "kullanici",
    varlikId: created.id,
    aciklama: `${check.session.user.name} yeni kullanıcı oluşturdu: ${parsed.data.adSoyad}`,
    detay: JSON.stringify({ email: parsed.data.email, rol: parsed.data.rol }),
  });

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function updateUserRole(userId: number, rol: UserRole) {
  const check = await requireAdmin();
  if ("error" in check) return { error: check.error };

  const sessionUserId = Number(check.session.user.id);
  if (sessionUserId === userId && rol !== "admin") {
    return { error: "Kendi yönetici yetkinizi kaldıramazsınız" };
  }

  const db = getDb();
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  await db.update(users).set({ rol }).where(eq(users.id, userId));
  await kayitIslemLog({
    kullaniciId: Number(check.session.user.id),
    kullaniciAd: check.session.user.name,
    islemTipi: "kullanici_rol_guncellendi",
    varlikTipi: "kullanici",
    varlikId: userId,
    aciklama: `${check.session.user.name} kullanıcı rolünü güncelledi: ${target?.adSoyad}`,
    detay: JSON.stringify({ eskiRol: target?.rol, yeniRol: rol }),
  });
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function deleteUser(userId: number) {
  const check = await requireAdmin();
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
    aciklama: `${check.session.user.name} kullanıcı sildi: ${target?.adSoyad}`,
    detay: JSON.stringify({ email: target?.email }),
  });
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}
