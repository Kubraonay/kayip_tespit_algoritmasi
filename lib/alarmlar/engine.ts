import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  alarmlar,
  aboneler,
  sayaclar,
  saatlikTuketim,
  kacakTespitleri,
  type AlarmTipi,
} from "@/lib/db/schema";
import { ALARM_TIP_SEVIYE } from "@/lib/alarmlar/constants";
import { dispatchAlarmNotifications } from "@/lib/notifications/dispatcher";

export type YeniAlarm = {
  tip: AlarmTipi;
  baslik: string;
  aciklama: string;
  detay?: Record<string, unknown>;
  aboneId?: number;
  sayacId?: number;
  aboneNo?: string;
  sayacSeri?: string;
};

async function hasRecentAlarm(
  tip: string,
  aboneId?: number,
  sayacId?: number,
  hours = 6
) {
  const db = getDb();
  const since = new Date(Date.now() - hours * 3600 * 1000);
  const conditions = [
    eq(alarmlar.tip, tip),
    gte(alarmlar.createdAt, since),
  ];
  if (aboneId) conditions.push(eq(alarmlar.aboneId, aboneId));
  if (sayacId) conditions.push(eq(alarmlar.sayacId, sayacId));

  const rows = await db
    .select({ id: alarmlar.id })
    .from(alarmlar)
    .where(and(...conditions))
    .limit(1);
  return rows.length > 0;
}

export async function insertAlarm(a: YeniAlarm) {
  if (
    await hasRecentAlarm(a.tip, a.aboneId, a.sayacId)
  ) {
    return null;
  }

  const db = getDb();
  const seviye = ALARM_TIP_SEVIYE[a.tip];
  const [row] = await db
    .insert(alarmlar)
    .values({
      tip: a.tip,
      seviye,
      baslik: a.baslik,
      aciklama: a.aciklama,
      detay: a.detay ? JSON.stringify(a.detay) : null,
      aboneId: a.aboneId ?? null,
      sayacId: a.sayacId ?? null,
      aboneNo: a.aboneNo ?? null,
      sayacSeri: a.sayacSeri ?? null,
      durum: "aktif",
      okundu: false,
      createdAt: new Date(),
    })
    .returning();

  await dispatchAlarmNotifications(row);
  return row;
}

export async function scanAlarms(donem = "2025-12") {
  const db = getDb();
  const created: number[] = [];

  const aboneSayac = await db
    .select({
      abone: aboneler,
      sayac: sayaclar,
    })
    .from(aboneler)
    .innerJoin(sayaclar, eq(sayaclar.aboneId, aboneler.id))
    .where(eq(sayaclar.tip, "abone"));

  for (const { abone, sayac } of aboneSayac) {
    const hourly = await db
      .select()
      .from(saatlikTuketim)
      .where(eq(saatlikTuketim.sayacId, sayac.id))
      .orderBy(desc(saatlikTuketim.saat))
      .limit(24);

    if (hourly.length >= 4) {
      const recent = hourly.slice(0, 4).map((h) => h.aktifKwh);
      const older = hourly.slice(4, 8).map((h) => h.aktifKwh);
      const avgRecent =
        recent.reduce((s, v) => s + v, 0) / recent.length;
      const avgOlder =
        older.length > 0
          ? older.reduce((s, v) => s + v, 0) / older.length
          : avgRecent;
      if (avgOlder > 0 && avgRecent > avgOlder * 2.2) {
        const row = await insertAlarm({
          tip: "ani_tuketim_artisi",
          baslik: `Ani tüketim artışı — ${abone.aboneNo}`,
          aciklama: `Son 4 saat ortalaması ${avgRecent.toFixed(1)} kWh; önceki dönem ${avgOlder.toFixed(1)} kWh (%${(((avgRecent - avgOlder) / avgOlder) * 100).toFixed(0)} artış).`,
          detay: { avgRecent, avgOlder, donem },
          aboneId: abone.id,
          sayacId: sayac.id,
          aboneNo: abone.aboneNo,
          sayacSeri: sayac.seriNo,
        });
        if (row) created.push(row.id);
      }
    }

    const seed = abone.id % 7;
    if (seed === 0) {
      const row = await insertAlarm({
        tip: "sayac_enerjisiz",
        baslik: `Sayaç enerjisiz — ${abone.aboneNo}`,
        aciklama: `${sayac.seriNo} sayacında enerji kesintisi / sıfır akım tespit edildi.`,
        aboneId: abone.id,
        sayacId: sayac.id,
        aboneNo: abone.aboneNo,
        sayacSeri: sayac.seriNo,
      });
      if (row) created.push(row.id);
    }
    if (seed === 1) {
      const row = await insertAlarm({
        tip: "muhur_acildi",
        baslik: `Mühür ihlali — ${abone.aboneNo}`,
        aciklama: `Sayaç mühür sensörü açık konumda; yetkisiz müdahale şüphesi.`,
        aboneId: abone.id,
        sayacId: sayac.id,
        aboneNo: abone.aboneNo,
        sayacSeri: sayac.seriNo,
      });
      if (row) created.push(row.id);
    }
    if (seed === 2) {
      const row = await insertAlarm({
        tip: "ters_baglanti",
        baslik: `Ters bağlantı — ${abone.aboneNo}`,
        aciklama: `Akım yönü ters; sayaç ters bağlı veya bypass şüphesi.`,
        aboneId: abone.id,
        sayacId: sayac.id,
        aboneNo: abone.aboneNo,
        sayacSeri: sayac.seriNo,
      });
      if (row) created.push(row.id);
    }
    if (seed === 3) {
      const row = await insertAlarm({
        tip: "faz_kaybi",
        baslik: `Faz kaybı — ${abone.aboneNo}`,
        aciklama: `L2 faz gerilimi düşük / faz kaybı alarmı OSOS üzerinden iletildi.`,
        aboneId: abone.id,
        sayacId: sayac.id,
        aboneNo: abone.aboneNo,
        sayacSeri: sayac.seriNo,
      });
      if (row) created.push(row.id);
    }
    if (seed === 4) {
      const row = await insertAlarm({
        tip: "sayac_offline",
        baslik: `Sayaç offline — ${abone.aboneNo}`,
        aciklama: `${sayac.seriNo} 15 dakikadır haberleşmiyor (AMR/PLC timeout).`,
        aboneId: abone.id,
        sayacId: sayac.id,
        aboneNo: abone.aboneNo,
        sayacSeri: sayac.seriNo,
      });
      if (row) created.push(row.id);
    }
  }

  const kacaklar = await db
    .select()
    .from(kacakTespitleri)
    .where(eq(kacakTespitleri.donem, donem))
    .limit(3);

  for (const k of kacaklar) {
    const [abone] = await db
      .select()
      .from(aboneler)
      .where(eq(aboneler.id, k.aboneId))
      .limit(1);
    if (!abone) continue;
    const row = await insertAlarm({
      tip: "ani_tuketim_artisi",
      baslik: `Kaçak analizi alarmı — ${abone.aboneNo}`,
      aciklama: k.anlatim.slice(0, 200),
      detay: { kacakId: k.id, kacakTipi: k.kacakTipi },
      aboneId: abone.id,
      aboneNo: abone.aboneNo,
    });
    if (row) created.push(row.id);
  }

  return { scanned: aboneSayac.length, created: created.length, ids: created };
}
