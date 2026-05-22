import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { getDb } from "./index";
import {
  aboneler,
  sayaclar,
  aylikTuketim,
  trafoMerkezleri,
  fiderler,
  kayipAnalizleri,
  settings,
} from "./schema";

export async function getSetting(key: string, defaultValue: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return row?.value ?? defaultValue;
}

export async function getConsumptionForPeriod(
  sayacIds: number[],
  year: number,
  month: number
) {
  if (sayacIds.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(aylikTuketim)
    .where(
      and(
        inArray(aylikTuketim.sayacId, sayacIds),
        eq(aylikTuketim.yil, year),
        eq(aylikTuketim.ay, month)
      )
    );
}

export async function sumConsumptionBySayacType(
  year: number,
  month: number
): Promise<Record<string, number>> {
  const db = getDb();
  const rows = await db
    .select({
      tip: sayaclar.tip,
      total: sql<number>`sum(${aylikTuketim.aktifKwh})`,
    })
    .from(aylikTuketim)
    .innerJoin(sayaclar, eq(aylikTuketim.sayacId, sayaclar.id))
    .where(and(eq(aylikTuketim.yil, year), eq(aylikTuketim.ay, month)))
    .groupBy(sayaclar.tip);
  const result: Record<string, number> = {};
  for (const r of rows) result[r.tip] = r.total ?? 0;
  return result;
}

export async function getFiderConsumption(
  fiderId: number,
  year: number,
  month: number
) {
  const db = getDb();
  const fiderSayac = await db
    .select()
    .from(sayaclar)
    .where(
      and(eq(sayaclar.fiderId, fiderId), eq(sayaclar.tip, "fider_giris"))
    )
    .limit(1);

  const aboneSayaclar = await db
    .select({ id: sayaclar.id })
    .from(sayaclar)
    .innerJoin(aboneler, eq(sayaclar.aboneId, aboneler.id))
    .where(
      and(eq(aboneler.fiderId, fiderId), eq(sayaclar.tip, "abone"))
    );

  const ids = [
    ...fiderSayac.map((s) => s.id),
    ...aboneSayaclar.map((s) => s.id),
  ];
  const consumptions = await getConsumptionForPeriod(ids, year, month);

  const eGiris =
    consumptions.find((c) =>
      fiderSayac.some((s) => s.id === c.sayacId)
    )?.aktifKwh ?? 0;

  const eAbone = consumptions
    .filter((c) => aboneSayaclar.some((s) => s.id === c.sayacId))
    .reduce((a, c) => a + c.aktifKwh, 0);

  return { eGiris, eAbone };
}

export async function getTrafoConsumption(
  trafoId: number,
  year: number,
  month: number
) {
  const db = getDb();
  const trafoGiris = await db
    .select()
    .from(sayaclar)
    .where(
      and(eq(sayaclar.trafoId, trafoId), eq(sayaclar.tip, "trafo_giris"))
    )
    .limit(1);

  const fiderList = await db
    .select()
    .from(fiderler)
    .where(eq(fiderler.trafoId, trafoId));

  let eFiderToplam = 0;
  let eAboneToplam = 0;
  for (const fider of fiderList) {
    const { eGiris, eAbone } = await getFiderConsumption(
      fider.id,
      year,
      month
    );
    eFiderToplam += eGiris;
    eAboneToplam += eAbone;
  }

  const girisIds = trafoGiris.map((s) => s.id);
  const girisCons = await getConsumptionForPeriod(girisIds, year, month);
  const eGiris = girisCons.reduce((a, c) => a + c.aktifKwh, 0);

  return { eGiris, eFiderToplam, eAboneToplam, fiderList };
}

export async function getDashboardStats(year: number, month: number) {
  const db = getDb();
  const [aboneCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aboneler)
    .where(eq(aboneler.durum, "aktif"));

  const [sayacCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sayaclar);

  const byType = await sumConsumptionBySayacType(year, month);
  const eGiris = byType["trafo_giris"] ?? 0;
  const eAbone = byType["abone"] ?? 0;
  const delta = eGiris - eAbone;
  const oran = eGiris > 0 ? (delta / eGiris) * 100 : 0;

  const alarms = await db
    .select()
    .from(kayipAnalizleri)
    .where(
      and(
        eq(kayipAnalizleri.donem, `${year}-${String(month).padStart(2, "0")}`),
        inArray(kayipAnalizleri.durum, ["uyari", "kritik"])
      )
    )
    .orderBy(desc(kayipAnalizleri.oranYuzde))
    .limit(10);

  const kritikCount = alarms.filter((a) => a.durum === "kritik").length;

  return {
    aboneCount: aboneCount?.count ?? 0,
    sayacCount: sayacCount?.count ?? 0,
    eGiris,
    eAbone,
    oran,
    alarms,
    kritikCount,
  };
}

export async function getAbonelerWithRelations() {
  const db = getDb();
  return db
    .select({
      abone: aboneler,
      trafoKod: trafoMerkezleri.kod,
      fiderKod: fiderler.kod,
    })
    .from(aboneler)
    .leftJoin(trafoMerkezleri, eq(aboneler.trafoId, trafoMerkezleri.id))
    .leftJoin(fiderler, eq(aboneler.fiderId, fiderler.id))
    .orderBy(aboneler.aboneNo);
}

export async function getAboneDetail(id: number) {
  const db = getDb();
  const [row] = await db
    .select({
      abone: aboneler,
      trafo: trafoMerkezleri,
      fider: fiderler,
    })
    .from(aboneler)
    .leftJoin(trafoMerkezleri, eq(aboneler.trafoId, trafoMerkezleri.id))
    .leftJoin(fiderler, eq(aboneler.fiderId, fiderler.id))
    .where(eq(aboneler.id, id))
    .limit(1);

  if (!row) return null;

  const sayacList = await db
    .select()
    .from(sayaclar)
    .where(eq(sayaclar.aboneId, id));

  const tuketim = sayacList.length
    ? await db
        .select()
        .from(aylikTuketim)
        .where(inArray(aylikTuketim.sayacId, sayacList.map((s) => s.id)))
        .orderBy(desc(aylikTuketim.yil), desc(aylikTuketim.ay))
    : [];

  return { ...row, sayaclar: sayacList, tuketim };
}

export async function getSebekeTree() {
  const db = getDb();
  const trafolar = await db.select().from(trafoMerkezleri);
  const fiderList = await db.select().from(fiderler);
  const aboneList = await db
    .select()
    .from(aboneler)
    .where(eq(aboneler.durum, "aktif"));
  return { trafolar, fiderler: fiderList, aboneler: aboneList };
}

export async function getRecentAnalyses(limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(kayipAnalizleri)
    .orderBy(desc(kayipAnalizleri.createdAt))
    .limit(limit);
}
