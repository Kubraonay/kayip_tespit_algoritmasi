"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getDb } from "@/lib/db";
import {
  sahaEkipleri,
  sahaPersonelleri,
  sahaGorevleri,
  sahaGorevDurumGecmisi,
  sahaGorevNotlari,
  sahaGorevFotograflari,
  sahaTutanaklari,
  sahaKonumlari,
  aboneler,
  kacakTespitleri,
  type TutanakIcerik,
} from "@/lib/db/schema";
import { kayitIslemLog } from "@/lib/audit/log";
import { generateGorevToken, canFieldUpdateStatus } from "@/lib/saha/utils";
import { getGorevByKacakId } from "@/lib/db/queries-saha";

async function requireSahaYonetim() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Oturum gerekli" as const };
  if (!(await hasPermission(session.user.role, "saha_yonetimi"))) {
    return { error: "Saha yönetim yetkiniz yok" as const };
  }
  return { session };
}

async function recordDurum(
  gorevId: number,
  durum: string,
  not: string | null,
  kullaniciId?: number
) {
  const db = getDb();
  await db.insert(sahaGorevDurumGecmisi).values({
    gorevId,
    durum,
    notMetni: not,
    kullaniciId: kullaniciId ?? null,
    createdAt: new Date(),
  });
}

export async function createSahaEkip(formData: FormData) {
  const authResult = await requireSahaYonetim();
  if ("error" in authResult) return authResult;
  const { session } = authResult;

  const parsed = z
    .object({
      kod: z.string().min(2),
      ad: z.string().min(2),
      bolge: z.string().optional(),
      trafoId: z.coerce.number().optional(),
    })
    .safeParse({
      kod: formData.get("kod"),
      ad: formData.get("ad"),
      bolge: formData.get("bolge") || undefined,
      trafoId: formData.get("trafoId") || undefined,
    });
  if (!parsed.success) return { error: "Geçersiz form" };

  const db = getDb();
  const [row] = await db
    .insert(sahaEkipleri)
    .values({
      kod: parsed.data.kod,
      ad: parsed.data.ad,
      bolge: parsed.data.bolge ?? null,
      trafoId: parsed.data.trafoId ?? null,
      aktif: true,
      createdAt: new Date(),
    })
    .returning();

  await kayitIslemLog({
    kullaniciId: Number(session.user.id),
    kullaniciAd: session.user.name,
    islemTipi: "saha_ekip_olusturuldu",
    varlikTipi: "saha_ekip",
    varlikId: row.id,
    aciklama: `Saha ekibi oluşturuldu: ${row.ad}`,
  });

  revalidatePath("/dashboard/saha-operasyonlari");
  return { success: true, id: row.id };
}

export async function createSahaPersonel(formData: FormData) {
  const authResult = await requireSahaYonetim();
  if ("error" in authResult) return authResult;
  const { session } = authResult;

  const parsed = z
    .object({
      sicilNo: z.string().min(2),
      adSoyad: z.string().min(2),
      telefon: z.string().optional(),
      ekipId: z.coerce.number().optional(),
      unvan: z.string().optional(),
    })
    .safeParse({
      sicilNo: formData.get("sicilNo"),
      adSoyad: formData.get("adSoyad"),
      telefon: formData.get("telefon") || undefined,
      ekipId: formData.get("ekipId") || undefined,
      unvan: formData.get("unvan") || "saha_teknisyeni",
    });
  if (!parsed.success) return { error: "Geçersiz form" };

  const db = getDb();
  const [row] = await db
    .insert(sahaPersonelleri)
    .values({
      sicilNo: parsed.data.sicilNo,
      adSoyad: parsed.data.adSoyad,
      telefon: parsed.data.telefon ?? null,
      ekipId: parsed.data.ekipId ?? null,
      unvan: parsed.data.unvan,
      aktif: true,
      createdAt: new Date(),
    })
    .returning();

  await kayitIslemLog({
    kullaniciId: Number(session.user.id),
    kullaniciAd: session.user.name,
    islemTipi: "saha_personel_olusturuldu",
    varlikTipi: "saha_personel",
    varlikId: row.id,
    aciklama: `Saha personeli: ${row.adSoyad}`,
  });

  revalidatePath("/dashboard/saha-operasyonlari/personel");
  return { success: true };
}

export async function createSahaGorev(formData: FormData) {
  const authResult = await requireSahaYonetim();
  if ("error" in authResult) return authResult;
  const { session } = authResult;

  const parsed = z
    .object({
      kacakTespitId: z.coerce.number().optional(),
      aboneId: z.coerce.number(),
      ekipId: z.coerce.number(),
      atananPersonelId: z.coerce.number().optional(),
      oncelik: z.enum(["dusuk", "normal", "yuksek"]).default("normal"),
      planlananTarih: z.string().optional(),
    })
    .safeParse({
      kacakTespitId: formData.get("kacakTespitId") || undefined,
      aboneId: formData.get("aboneId"),
      ekipId: formData.get("ekipId"),
      atananPersonelId: formData.get("atananPersonelId") || undefined,
      oncelik: formData.get("oncelik") || "normal",
      planlananTarih: formData.get("planlananTarih") || undefined,
    });
  if (!parsed.success) return { error: "Geçersiz form" };

  if (parsed.data.kacakTespitId) {
    const existing = await getGorevByKacakId(parsed.data.kacakTespitId);
    if (existing) return { error: "Bu tespit için zaten saha görevi var" };
  }

  const db = getDb();
  const [abone] = await db
    .select()
    .from(aboneler)
    .where(eq(aboneler.id, parsed.data.aboneId))
    .limit(1);
  if (!abone) return { error: "Abone bulunamadı" };

  const token = generateGorevToken();
  const [gorev] = await db
    .insert(sahaGorevleri)
    .values({
      kacakTespitId: parsed.data.kacakTespitId ?? null,
      aboneId: parsed.data.aboneId,
      ekipId: parsed.data.ekipId,
      atananPersonelId: parsed.data.atananPersonelId ?? null,
      durum: "atandi",
      oncelik: parsed.data.oncelik,
      planlananTarih: parsed.data.planlananTarih
        ? new Date(parsed.data.planlananTarih)
        : null,
      hedefEnlem: abone.enlem,
      hedefBoylam: abone.boylam,
      paylasimToken: token,
      createdBy: Number(session.user.id),
      createdAt: new Date(),
    })
    .returning();

  await recordDurum(gorev.id, "beklemede", "Görev oluşturuldu", Number(session.user.id));
  await recordDurum(gorev.id, "atandi", "Ekibe atandı", Number(session.user.id));

  await kayitIslemLog({
    kullaniciId: Number(session.user.id),
    kullaniciAd: session.user.name,
    islemTipi: "saha_gorev_olusturuldu",
    varlikTipi: "saha_gorev",
    varlikId: gorev.id,
    aciklama: `Saha görevi #${gorev.id} — ${abone.aboneNo}`,
    detay: JSON.stringify({ token }),
  });

  revalidatePath("/dashboard/saha-operasyonlari");
  revalidatePath("/dashboard/kacak-tespit");
  return { success: true, gorevId: gorev.id, token };
}

export async function updateGorevDurumByToken(
  token: string,
  durum: string,
  not?: string
) {
  if (!canFieldUpdateStatus(durum)) {
    return { error: "Bu durum saha tarafından güncellenemez" };
  }
  const db = getDb();
  const [gorev] = await db
    .select()
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.paylasimToken, token))
    .limit(1);
  if (!gorev) return { error: "Geçersiz görev" };
  return updateGorevDurum(gorev.id, durum, not, { fromToken: true });
}

export async function addGorevNotuByToken(token: string, icerik: string) {
  const db = getDb();
  const [gorev] = await db
    .select()
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.paylasimToken, token))
    .limit(1);
  if (!gorev) return { error: "Geçersiz görev" };
  return addGorevNotu(gorev.id, icerik, "saha");
}

export async function updateGorevDurum(
  gorevId: number,
  durum: string,
  not?: string,
  options?: { fromToken?: boolean }
) {
  if (options?.fromToken) {
    if (!canFieldUpdateStatus(durum)) {
      return { error: "Bu durum saha tarafından güncellenemez" };
    }
  } else {
    const authResult = await requireSahaYonetim();
    if ("error" in authResult) return authResult;
  }

  const db = getDb();
  const [gorev] = await db
    .select()
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.id, gorevId))
    .limit(1);
  if (!gorev) return { error: "Görev bulunamadı" };

  const updates: Partial<typeof sahaGorevleri.$inferInsert> = {
    durum,
  };
  if (durum === "sahada" && !gorev.baslangicAt) {
    updates.baslangicAt = new Date();
  }
  if (durum === "tamamlandi" || durum === "iptal") {
    updates.bitisAt = new Date();
  }

  await db.update(sahaGorevleri).set(updates).where(eq(sahaGorevleri.id, gorevId));

  const session = options?.fromToken ? null : await auth();
  await recordDurum(
    gorevId,
    durum,
    not ?? null,
    session?.user?.id ? Number(session.user.id) : undefined
  );

  if (session?.user) {
    await kayitIslemLog({
      kullaniciId: Number(session.user.id),
      kullaniciAd: session.user.name,
      islemTipi: "saha_durum_guncellendi",
      varlikTipi: "saha_gorev",
      varlikId: gorevId,
      aciklama: `Görev #${gorevId} → ${durum}`,
    });
  }

  revalidatePath("/dashboard/saha-operasyonlari");
  revalidatePath(`/dashboard/saha-operasyonlari/gorevler/${gorevId}`);
  return { success: true };
}

export async function addGorevNotu(
  gorevId: number,
  icerik: string,
  kaynak: "merkez" | "saha" = "merkez"
) {
  if (kaynak === "merkez") {
    const authResult = await requireSahaYonetim();
    if ("error" in authResult) return authResult;
  }

  const db = getDb();
  const session = kaynak === "merkez" ? await auth() : null;
  await db.insert(sahaGorevNotlari).values({
    gorevId,
    kullaniciId: session?.user?.id ? Number(session.user.id) : null,
    kaynak,
    icerik,
    createdAt: new Date(),
  });

  revalidatePath(`/dashboard/saha-operasyonlari/gorevler/${gorevId}`);
  return { success: true };
}

export async function saveTutanak(
  gorevId: number,
  icerik: TutanakIcerik,
  imzalayan?: string,
  options?: { fromToken?: boolean }
) {
  if (!options?.fromToken) {
    const authResult = await requireSahaYonetim();
    if ("error" in authResult) return authResult;
  }

  const db = getDb();
  const json = JSON.stringify(icerik);
  const existing = await db
    .select()
    .from(sahaTutanaklari)
    .where(eq(sahaTutanaklari.gorevId, gorevId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(sahaTutanaklari)
      .set({ icerik: json, imzalayan: imzalayan ?? existing[0].imzalayan })
      .where(eq(sahaTutanaklari.gorevId, gorevId));
  } else {
    await db.insert(sahaTutanaklari).values({
      gorevId,
      icerik: json,
      imzalayan: imzalayan ?? null,
      createdAt: new Date(),
    });
  }

  const session = await auth();
  if (session?.user) {
    await kayitIslemLog({
      kullaniciId: Number(session.user.id),
      kullaniciAd: session.user.name,
      islemTipi: "saha_tutanak_olusturuldu",
      varlikTipi: "saha_gorev",
      varlikId: gorevId,
      aciklama: `Dijital tutanak kaydedildi — görev #${gorevId}`,
    });
  }

  revalidatePath(`/dashboard/saha-operasyonlari/gorevler/${gorevId}`);
  return { success: true };
}

export async function saveTutanakFromToken(
  token: string,
  icerik: TutanakIcerik,
  imzalayan: string
) {
  const db = getDb();
  const [gorev] = await db
    .select()
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.paylasimToken, token))
    .limit(1);
  if (!gorev) return { error: "Geçersiz görev" };
  return saveTutanak(gorev.id, icerik, imzalayan, { fromToken: true });
}

export async function kaydetKonum(params: {
  personelId: number;
  gorevId?: number;
  enlem: number;
  boylam: number;
  kaynak: "gps" | "simulasyon";
}) {
  const db = getDb();
  await db.insert(sahaKonumlari).values({
    personelId: params.personelId,
    gorevId: params.gorevId ?? null,
    enlem: params.enlem,
    boylam: params.boylam,
    kaynak: params.kaynak,
    createdAt: new Date(),
  });
  return { success: true };
}

export async function createGorevFromKacak(kacakTespitId: number, ekipId: number, personelId?: number) {
  const db = getDb();
  const [kacak] = await db
    .select()
    .from(kacakTespitleri)
    .where(eq(kacakTespitleri.id, kacakTespitId))
    .limit(1);
  if (!kacak) return { error: "Kaçak tespiti bulunamadı" };

  const fd = new FormData();
  fd.set("kacakTespitId", String(kacakTespitId));
  fd.set("aboneId", String(kacak.aboneId));
  fd.set("ekipId", String(ekipId));
  if (personelId) fd.set("atananPersonelId", String(personelId));
  fd.set("oncelik", kacak.durum === "kritik" ? "yuksek" : "normal");
  return createSahaGorev(fd);
}
