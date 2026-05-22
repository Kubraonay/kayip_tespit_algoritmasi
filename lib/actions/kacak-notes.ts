"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import {
  kacakNotlari,
  kacakTespitleri,
  aboneler,
  users,
} from "@/lib/db/schema";
import { hasPermission } from "@/lib/db/queries-rbac";
import { kayitIslemLog } from "@/lib/audit/log";
import { z } from "zod";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Oturum gerekli" as const };
  }
  if (!(await hasPermission(session.user.role, "veri_duzenleme"))) {
    return { error: "Not ekleme yetkiniz yok" as const };
  }
  return { session };
}

export async function getKacakNotlari(kacakTespitId: number) {
  const db = getDb();
  return db
    .select({
      not: kacakNotlari,
      kullaniciAd: users.adSoyad,
      kullaniciEmail: users.email,
      kullaniciRol: users.rol,
    })
    .from(kacakNotlari)
    .innerJoin(users, eq(kacakNotlari.kullaniciId, users.id))
    .where(eq(kacakNotlari.kacakTespitId, kacakTespitId))
    .orderBy(desc(kacakNotlari.createdAt));
}

const noteSchema = z.object({
  kacakTespitId: z.coerce.number(),
  icerik: z.string().min(3, "Not en az 3 karakter olmalı").max(2000),
});

export async function addKacakNotu(formData: FormData) {
  const check = await requireSession();
  if ("error" in check) return { error: check.error };

  const parsed = noteSchema.safeParse({
    kacakTespitId: formData.get("kacakTespitId"),
    icerik: formData.get("icerik"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz not" };
  }

  const db = getDb();
  const [kacakRow] = await db
    .select({
      kacak: kacakTespitleri,
      aboneNo: aboneler.aboneNo,
    })
    .from(kacakTespitleri)
    .innerJoin(aboneler, eq(kacakTespitleri.aboneId, aboneler.id))
    .where(eq(kacakTespitleri.id, parsed.data.kacakTespitId))
    .limit(1);

  if (!kacakRow) return { error: "Tespit bulunamadı" };

  const userId = Number(check.session.user.id);
  const [inserted] = await db
    .insert(kacakNotlari)
    .values({
      kacakTespitId: parsed.data.kacakTespitId,
      kullaniciId: userId,
      icerik: parsed.data.icerik.trim(),
    })
    .returning();

  await kayitIslemLog({
    kullaniciId: userId,
    kullaniciAd: check.session.user.name ?? check.session.user.email,
    islemTipi: "kacak_not_eklendi",
    varlikTipi: "kacak_tespit",
    varlikId: parsed.data.kacakTespitId,
    aciklama: `${check.session.user.name ?? "Kullanıcı"} kaçak tespitine not ekledi`,
    detay: JSON.stringify({
      notId: inserted.id,
      aboneNo: kacakRow.aboneNo,
      ozet: parsed.data.icerik.slice(0, 120),
    }),
  });

  revalidatePath("/dashboard/kacak-tespit");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}
