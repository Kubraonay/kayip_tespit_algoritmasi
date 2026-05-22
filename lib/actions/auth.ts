"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  adSoyad: z.string().min(2, "Ad soyad gerekli"),
});

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    adSoyad: formData.get("adSoyad"),
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
  await db.insert(users).values({
    email: parsed.data.email,
    passwordHash: hash,
    adSoyad: parsed.data.adSoyad,
    rol: "muhendis",
  });
  return { success: true };
}
