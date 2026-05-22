"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  aboneler,
  sayaclar,
  aylikTuketim,
  trafoMerkezleri,
  fiderler,
} from "@/lib/db/schema";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { kayitIslemLog } from "@/lib/audit/log";

async function requireVeriDuzenleme() {
  const session = await auth();
  if (!session?.user) return { error: "Oturum gerekli" as const };
  if (!(await hasPermission(session.user.role, "veri_duzenleme"))) {
    return { error: "Veri düzenleme yetkisi gerekli" as const };
  }
  return { session };
}

async function requireVeriAktar() {
  const session = await auth();
  if (!session?.user) return { error: "Oturum gerekli" as const };
  if (!(await hasPermission(session.user.role, "veri_aktar"))) {
    return { error: "Veri aktarım yetkisi gerekli" as const };
  }
  return { session };
}

async function logAction(
  islemTipi: string,
  aciklama: string,
  detay?: object,
  varlikTipi?: string,
  varlikId?: number
) {
  const session = await auth();
  if (!session?.user) return;
  await kayitIslemLog({
    kullaniciId: Number(session.user.id),
    kullaniciAd: session.user.name ?? session.user.email,
    islemTipi,
    varlikTipi,
    varlikId,
    aciklama,
    detay: detay ? JSON.stringify(detay) : null,
  });
}

export async function createAbone(formData: FormData) {
  const check = await requireVeriDuzenleme();
  if ("error" in check) return { error: check.error };
  const db = getDb();
  await db.insert(aboneler).values({
    aboneNo: formData.get("aboneNo") as string,
    ad: formData.get("ad") as string,
    soyad: formData.get("soyad") as string,
    adres: (formData.get("adres") as string) || null,
    trafoId: Number(formData.get("trafoId")) || null,
    fiderId: Number(formData.get("fiderId")) || null,
    tarifeGrubu: (formData.get("tarifeGrubu") as string) || "mesken",
    durum: "aktif",
  });
  const aboneNo = formData.get("aboneNo") as string;
  await logAction(
    "abone_olusturuldu",
    `${(await auth())?.user?.name ?? "Kullanıcı"} yeni abone ekledi: ${aboneNo}`,
    { aboneNo },
    "abone"
  );
  revalidatePath("/dashboard/aboneler");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function createTuketim(formData: FormData) {
  const check = await requireVeriDuzenleme();
  if ("error" in check) return { error: check.error };
  const db = getDb();
  const sayacId = Number(formData.get("sayacId"));
  const yil = Number(formData.get("yil"));
  const ay = Number(formData.get("ay"));
  const aktifKwh = Number(formData.get("aktifKwh"));

  const existing = await db
    .select()
    .from(aylikTuketim)
    .where(
      eq(aylikTuketim.sayacId, sayacId)
    );

  const match = existing.find((e) => e.yil === yil && e.ay === ay);
  if (match) {
    await db
      .update(aylikTuketim)
      .set({ aktifKwh })
      .where(eq(aylikTuketim.id, match.id));
  } else {
    await db.insert(aylikTuketim).values({
      sayacId,
      yil,
      ay,
      aktifKwh,
    });
  }
  await logAction(
    "tuketim_guncellendi",
    `Aylık tüketim güncellendi (sayaç #${sayacId}, ${yil}/${ay})`,
    { sayacId, yil, ay, aktifKwh },
    "sayac",
    sayacId
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sayaclar");
  revalidatePath("/dashboard/loglar");
  return { success: true };
}

export async function createTrafo(formData: FormData) {
  const check = await requireVeriDuzenleme();
  if ("error" in check) return { error: check.error };
  const db = getDb();
  const kod = formData.get("kod") as string;
  const [trafo] = await db
    .insert(trafoMerkezleri)
    .values({
      kod,
      ad: formData.get("ad") as string,
      ilce: (formData.get("ilce") as string) || null,
      kapasiteKva: Number(formData.get("kapasiteKva")) || 400,
      gerilimKv: Number(formData.get("gerilimKv")) || 15.8,
    })
    .returning();
  await db.insert(sayaclar).values({
    seriNo: `TRF-GIR-${kod}`,
    tip: "trafo_giris",
    trafoId: trafo.id,
    marka: "Landis",
  });
  revalidatePath("/dashboard/sebeke");
  return { success: true };
}

export async function createFider(formData: FormData) {
  const check = await requireVeriDuzenleme();
  if ("error" in check) return { error: check.error };
  const db = getDb();
  const trafoId = Number(formData.get("trafoId"));
  const fider = await db
    .insert(fiderler)
    .values({
      trafoId,
      kod: formData.get("kod") as string,
      ad: formData.get("ad") as string,
      hatUzunlukM: Number(formData.get("hatUzunlukM")) || 500,
      kesitMm2: Number(formData.get("kesitMm2")) || 95,
    })
    .returning();

  await db.insert(sayaclar).values({
    seriNo: `FID-GIR-${fider[0].id}-${Date.now()}`,
    tip: "fider_giris",
    fiderId: fider[0].id,
    trafoId,
    marka: "Landis",
  });

  revalidatePath("/dashboard/sebeke");
  return { success: true };
}

export async function createSayac(formData: FormData) {
  const check = await requireVeriDuzenleme();
  if ("error" in check) return { error: check.error };
  const db = getDb();
  await db.insert(sayaclar).values({
    seriNo: formData.get("seriNo") as string,
    tip: formData.get("tip") as "abone" | "bolgesel" | "trafo_giris" | "trafo_cikis" | "fider_giris",
    aboneId: Number(formData.get("aboneId")) || null,
    trafoId: Number(formData.get("trafoId")) || null,
    fiderId: Number(formData.get("fiderId")) || null,
    marka: (formData.get("marka") as string) || null,
  });
  revalidatePath("/dashboard/sayaclar");
  return { success: true };
}

const importAboneRow = z.object({
  abone_no: z.string(),
  ad: z.string(),
  soyad: z.string(),
  trafo_kod: z.string(),
  fider_kod: z.string(),
  tarife: z.string().optional(),
});

export async function importAboneler(rows: Record<string, string>[]) {
  const check = await requireVeriAktar();
  if ("error" in check) {
    return { error: check.error, basarili: 0, hatalar: [check.error] as string[] };
  }
  const db = getDb();
  const trafolar = await db.select().from(trafoMerkezleri);
  const fiderList = await db.select().from(fiderler);
  let basarili = 0;
  const hatalar: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = importAboneRow.safeParse({
      abone_no: rows[i].abone_no?.trim(),
      ad: rows[i].ad?.trim(),
      soyad: rows[i].soyad?.trim(),
      trafo_kod: rows[i].trafo_kod?.trim(),
      fider_kod: rows[i].fider_kod?.trim(),
      tarife: rows[i].tarife?.trim(),
    });
    if (!parsed.success) {
      hatalar.push(`Satır ${i + 2}: ${parsed.error.message}`);
      continue;
    }
    const trafo = trafolar.find((t) => t.kod === parsed.data.trafo_kod);
    const fider = fiderList.find(
      (f) => f.kod === parsed.data.fider_kod && f.trafoId === trafo?.id
    );
    if (!trafo || !fider) {
      hatalar.push(`Satır ${i + 2}: trafo/fider bulunamadı`);
      continue;
    }
    try {
      const [abone] = await db
        .insert(aboneler)
        .values({
          aboneNo: parsed.data.abone_no,
          ad: parsed.data.ad,
          soyad: parsed.data.soyad,
          trafoId: trafo.id,
          fiderId: fider.id,
          tarifeGrubu: parsed.data.tarife || "mesken",
          durum: "aktif",
        })
        .returning();
      await db.insert(sayaclar).values({
        seriNo: `SYC-${parsed.data.abone_no}`,
        tip: "abone",
        aboneId: abone.id,
        fiderId: fider.id,
        trafoId: trafo.id,
      });
      basarili++;
    } catch (e) {
      hatalar.push(`Satır ${i + 2}: ${(e as Error).message}`);
    }
  }
  revalidatePath("/dashboard/aboneler");
  return { basarili, hatalar };
}

export async function importTuketim(rows: Record<string, string>[]) {
  const check = await requireVeriAktar();
  if ("error" in check) {
    return { error: check.error, basarili: 0, hatalar: [check.error] as string[] };
  }
  const db = getDb();
  const allSayaclar = await db.select().from(sayaclar);
  let basarili = 0;
  const hatalar: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const seriNo = rows[i].seri_no?.trim();
    const yil = Number(rows[i].yil);
    const ay = Number(rows[i].ay);
    const aktifKwh = Number(rows[i].aktif_kwh);
    const sayac = allSayaclar.find((s) => s.seriNo === seriNo);
    if (!sayac || !yil || !ay || isNaN(aktifKwh)) {
      hatalar.push(`Satır ${i + 2}: geçersiz veri`);
      continue;
    }
    try {
      const existing = await db
        .select()
        .from(aylikTuketim)
        .where(eq(aylikTuketim.sayacId, sayac.id));
      const match = existing.find((e) => e.yil === yil && e.ay === ay);
      if (match) {
        await db
          .update(aylikTuketim)
          .set({ aktifKwh })
          .where(eq(aylikTuketim.id, match.id));
      } else {
        await db.insert(aylikTuketim).values({
          sayacId: sayac.id,
          yil,
          ay,
          aktifKwh,
        });
      }
      basarili++;
    } catch (e) {
      hatalar.push(`Satır ${i + 2}: ${(e as Error).message}`);
    }
  }
  revalidatePath("/dashboard");
  return { basarili, hatalar };
}
