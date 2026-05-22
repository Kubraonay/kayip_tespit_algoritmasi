import { eq, desc, sql, and, inArray } from "drizzle-orm";
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
  users,
  trafoMerkezleri,
  type SahaGorevDurum,
} from "@/lib/db/schema";

export async function getSahaEkipleri() {
  const db = getDb();
  return db
    .select({
      ekip: sahaEkipleri,
      trafoKod: trafoMerkezleri.kod,
    })
    .from(sahaEkipleri)
    .leftJoin(trafoMerkezleri, eq(sahaEkipleri.trafoId, trafoMerkezleri.id))
    .orderBy(sahaEkipleri.kod);
}

export async function getSahaPersonelleri(ekipId?: number) {
  const db = getDb();
  const base = db
    .select({
      personel: sahaPersonelleri,
      ekipAd: sahaEkipleri.ad,
      ekipKod: sahaEkipleri.kod,
    })
    .from(sahaPersonelleri)
    .leftJoin(sahaEkipleri, eq(sahaPersonelleri.ekipId, sahaEkipleri.id));
  if (ekipId) {
    return base
      .where(eq(sahaPersonelleri.ekipId, ekipId))
      .orderBy(sahaPersonelleri.adSoyad);
  }
  return base.orderBy(sahaPersonelleri.adSoyad);
}

export async function getSahaGorevleri(filters?: {
  durum?: string;
  ekipId?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (filters?.durum) conditions.push(eq(sahaGorevleri.durum, filters.durum));
  if (filters?.ekipId) conditions.push(eq(sahaGorevleri.ekipId, filters.ekipId));

  const base = db
    .select({
      gorev: sahaGorevleri,
      aboneNo: aboneler.aboneNo,
      aboneAd: aboneler.ad,
      aboneSoyad: aboneler.soyad,
      aboneAdres: aboneler.adres,
      ekipAd: sahaEkipleri.ad,
      ekipKod: sahaEkipleri.kod,
      personelAd: sahaPersonelleri.adSoyad,
      kacakTipi: kacakTespitleri.kacakTipi,
    })
    .from(sahaGorevleri)
    .innerJoin(aboneler, eq(sahaGorevleri.aboneId, aboneler.id))
    .innerJoin(sahaEkipleri, eq(sahaGorevleri.ekipId, sahaEkipleri.id))
    .leftJoin(
      sahaPersonelleri,
      eq(sahaGorevleri.atananPersonelId, sahaPersonelleri.id)
    )
    .leftJoin(
      kacakTespitleri,
      eq(sahaGorevleri.kacakTespitId, kacakTespitleri.id)
    )
    .orderBy(desc(sahaGorevleri.createdAt));

  if (conditions.length > 0) {
    return base.where(and(...conditions));
  }
  return base;
}

export async function getSahaGorevById(id: number) {
  const rows = await getSahaGorevleri();
  return rows.find((r) => r.gorev.id === id) ?? null;
}

export async function getSahaGorevByToken(token: string) {
  const db = getDb();
  const rows = await db
    .select({
      gorev: sahaGorevleri,
      aboneNo: aboneler.aboneNo,
      aboneAd: aboneler.ad,
      aboneSoyad: aboneler.soyad,
      aboneAdres: aboneler.adres,
      ekipAd: sahaEkipleri.ad,
      ekipKod: sahaEkipleri.kod,
      personelAd: sahaPersonelleri.adSoyad,
      personelId: sahaPersonelleri.id,
      kacakTipi: kacakTespitleri.kacakTipi,
      kacakAnlatim: kacakTespitleri.anlatim,
    })
    .from(sahaGorevleri)
    .innerJoin(aboneler, eq(sahaGorevleri.aboneId, aboneler.id))
    .innerJoin(sahaEkipleri, eq(sahaGorevleri.ekipId, sahaEkipleri.id))
    .leftJoin(
      sahaPersonelleri,
      eq(sahaGorevleri.atananPersonelId, sahaPersonelleri.id)
    )
    .leftJoin(
      kacakTespitleri,
      eq(sahaGorevleri.kacakTespitId, kacakTespitleri.id)
    )
    .where(eq(sahaGorevleri.paylasimToken, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGorevDurumGecmisi(gorevId: number) {
  const db = getDb();
  return db
    .select({
      kayit: sahaGorevDurumGecmisi,
      kullaniciAd: users.adSoyad,
    })
    .from(sahaGorevDurumGecmisi)
    .leftJoin(users, eq(sahaGorevDurumGecmisi.kullaniciId, users.id))
    .where(eq(sahaGorevDurumGecmisi.gorevId, gorevId))
    .orderBy(desc(sahaGorevDurumGecmisi.createdAt));
}

export async function getGorevNotlari(gorevId: number) {
  const db = getDb();
  return db
    .select({
      not: sahaGorevNotlari,
      kullaniciAd: users.adSoyad,
    })
    .from(sahaGorevNotlari)
    .leftJoin(users, eq(sahaGorevNotlari.kullaniciId, users.id))
    .where(eq(sahaGorevNotlari.gorevId, gorevId))
    .orderBy(desc(sahaGorevNotlari.createdAt));
}

export async function getGorevFotograflari(gorevId: number) {
  const db = getDb();
  return db
    .select()
    .from(sahaGorevFotograflari)
    .where(eq(sahaGorevFotograflari.gorevId, gorevId))
    .orderBy(desc(sahaGorevFotograflari.createdAt));
}

export async function getGorevTutanak(gorevId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(sahaTutanaklari)
    .where(eq(sahaTutanaklari.gorevId, gorevId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSahaKpi() {
  const db = getDb();
  const acik = await db
    .select({ count: sql<number>`count(*)` })
    .from(sahaGorevleri)
    .where(
      inArray(sahaGorevleri.durum, [
        "beklemede",
        "atandi",
        "yola_cikildi",
        "sahada",
        "inceleme",
      ])
    );
  const sahada = await db
    .select({ count: sql<number>`count(*)` })
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.durum, "sahada"));
  const tamamlanan = await db
    .select({ count: sql<number>`count(*)` })
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.durum, "tamamlandi"));
  const ekipSayisi = await db
    .select({ count: sql<number>`count(*)` })
    .from(sahaEkipleri)
    .where(eq(sahaEkipleri.aktif, true));
  return {
    acikGorev: acik[0]?.count ?? 0,
    sahadaGorev: sahada[0]?.count ?? 0,
    tamamlanan: tamamlanan[0]?.count ?? 0,
    aktifEkip: ekipSayisi[0]?.count ?? 0,
  };
}

export async function getSonKonumlar() {
  const db = getDb();
  const rows = await db
    .select({
      personelId: sahaKonumlari.personelId,
      gorevId: sahaKonumlari.gorevId,
      enlem: sahaKonumlari.enlem,
      boylam: sahaKonumlari.boylam,
      kaynak: sahaKonumlari.kaynak,
      createdAt: sahaKonumlari.createdAt,
      personelAd: sahaPersonelleri.adSoyad,
      ekipAd: sahaEkipleri.ad,
      gorevDurum: sahaGorevleri.durum,
      aboneNo: aboneler.aboneNo,
      hedefEnlem: sahaGorevleri.hedefEnlem,
      hedefBoylam: sahaGorevleri.hedefBoylam,
    })
    .from(sahaKonumlari)
    .innerJoin(
      sahaPersonelleri,
      eq(sahaKonumlari.personelId, sahaPersonelleri.id)
    )
    .leftJoin(sahaEkipleri, eq(sahaPersonelleri.ekipId, sahaEkipleri.id))
    .leftJoin(sahaGorevleri, eq(sahaKonumlari.gorevId, sahaGorevleri.id))
    .leftJoin(aboneler, eq(sahaGorevleri.aboneId, aboneler.id))
    .orderBy(desc(sahaKonumlari.createdAt));

  const seen = new Set<number>();
  const latest: typeof rows = [];
  for (const r of rows) {
    if (seen.has(r.personelId)) continue;
    seen.add(r.personelId);
    latest.push(r);
  }
  return latest;
}

export async function getAktifGorevlerHarita() {
  const db = getDb();
  return db
    .select({
      gorev: sahaGorevleri,
      aboneNo: aboneler.aboneNo,
      aboneAd: aboneler.ad,
      aboneSoyad: aboneler.soyad,
      ekipAd: sahaEkipleri.ad,
    })
    .from(sahaGorevleri)
    .innerJoin(aboneler, eq(sahaGorevleri.aboneId, aboneler.id))
    .innerJoin(sahaEkipleri, eq(sahaGorevleri.ekipId, sahaEkipleri.id))
    .where(
      inArray(sahaGorevleri.durum, [
        "atandi",
        "yola_cikildi",
        "sahada",
        "inceleme",
      ])
    );
}

export async function getGorevByKacakId(kacakTespitId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.kacakTespitId, kacakTespitId))
    .limit(1);
  return rows[0] ?? null;
}

export type { SahaGorevDurum };
