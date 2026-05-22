import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "./index";
import {
  aboneler,
  sayaclar,
  aylikTuketim,
  saatlikTuketim,
  kacakTespitleri,
  trafoMerkezleri,
  fiderler,
  kayipAnalizleri,
} from "./schema";
import type { IspatKaydi } from "./schema";

export type MapAbone = {
  id: number;
  aboneNo: string;
  ad: string;
  soyad: string;
  enlem: number;
  boylam: number;
  trafoId: number | null;
  fiderId: number | null;
  trafoKod: string | null;
  fiderKod: string | null;
  tarifeGrubu: string | null;
  durum: string;
  kacak: boolean;
  kacakDurum?: "uyari" | "kritik";
  kacakTipi?: string;
  kacakId?: number;
};

export async function getMapAboneler(
  donem: string,
  filters: {
    trafoId?: number;
    fiderId?: number;
    tarife?: string;
    sadeceKacak?: boolean;
    durum?: string;
  }
): Promise<MapAbone[]> {
  const db = getDb();
  const rows = await db
    .select({
      abone: aboneler,
      trafoKod: trafoMerkezleri.kod,
      fiderKod: fiderler.kod,
    })
    .from(aboneler)
    .leftJoin(trafoMerkezleri, eq(aboneler.trafoId, trafoMerkezleri.id))
    .leftJoin(fiderler, eq(aboneler.fiderId, fiderler.id));

  const kacaklar = await db
    .select()
    .from(kacakTespitleri)
    .where(eq(kacakTespitleri.donem, donem));
  const kacakByAbone = new Map(kacaklar.map((k) => [k.aboneId, k]));

  let result: MapAbone[] = rows
    .filter((r) => r.abone.enlem != null && r.abone.boylam != null)
    .map(({ abone, trafoKod, fiderKod }) => {
      const k = kacakByAbone.get(abone.id);
      return {
        id: abone.id,
        aboneNo: abone.aboneNo,
        ad: abone.ad,
        soyad: abone.soyad,
        enlem: abone.enlem!,
        boylam: abone.boylam!,
        trafoId: abone.trafoId,
        fiderId: abone.fiderId,
        trafoKod,
        fiderKod,
        tarifeGrubu: abone.tarifeGrubu,
        durum: abone.durum,
        kacak: !!k,
        kacakDurum: k?.durum,
        kacakTipi: k?.kacakTipi,
        kacakId: k?.id,
      };
    });

  if (filters.trafoId)
    result = result.filter((a) => a.trafoId === filters.trafoId);
  if (filters.fiderId)
    result = result.filter((a) => a.fiderId === filters.fiderId);
  if (filters.tarife)
    result = result.filter((a) => a.tarifeGrubu === filters.tarife);
  if (filters.durum)
    result = result.filter((a) => a.durum === filters.durum);
  if (filters.sadeceKacak) result = result.filter((a) => a.kacak);

  return result;
}

export async function getHourlySystemProfile(year: number, month: number) {
  const db = getDb();
  const rows = await db
    .select({
      saat: saatlikTuketim.saat,
      kwh: saatlikTuketim.aktifKwh,
    })
    .from(saatlikTuketim)
    .where(
      and(eq(saatlikTuketim.yil, year), eq(saatlikTuketim.ay, month))
    );

  const agg = new Map<number, number>();
  for (const r of rows) {
    agg.set(r.saat, (agg.get(r.saat) ?? 0) + r.kwh);
  }
  return Array.from({ length: 24 }, (_, saat) => ({
    saat,
    label: `${String(saat).padStart(2, "0")}:00`,
    kwh: Math.round((agg.get(saat) ?? 0) * 10) / 10,
    aboneOrt: Math.round(((agg.get(saat) ?? 0) / 20) * 10) / 10,
  }));
}

export async function getKacakTespitleriWithAbone(donem: string) {
  const db = getDb();
  return db
    .select({
      kacak: kacakTespitleri,
      abone: aboneler,
      trafoKod: trafoMerkezleri.kod,
      fiderKod: fiderler.kod,
    })
    .from(kacakTespitleri)
    .innerJoin(aboneler, eq(kacakTespitleri.aboneId, aboneler.id))
    .leftJoin(trafoMerkezleri, eq(aboneler.trafoId, trafoMerkezleri.id))
    .leftJoin(fiderler, eq(aboneler.fiderId, fiderler.id))
    .where(eq(kacakTespitleri.donem, donem));
}

export function parseIspatlar(json: string): IspatKaydi[] {
  try {
    return JSON.parse(json) as IspatKaydi[];
  } catch {
    return [];
  }
}

export async function getKacakById(id: number) {
  const db = getDb();
  const [row] = await db
    .select({
      kacak: kacakTespitleri,
      abone: aboneler,
      trafoKod: trafoMerkezleri.kod,
      fiderKod: fiderler.kod,
    })
    .from(kacakTespitleri)
    .innerJoin(aboneler, eq(kacakTespitleri.aboneId, aboneler.id))
    .leftJoin(trafoMerkezleri, eq(aboneler.trafoId, trafoMerkezleri.id))
    .leftJoin(fiderler, eq(aboneler.fiderId, fiderler.id))
    .where(eq(kacakTespitleri.id, id))
    .limit(1);
  return row ?? null;
}

export async function getAboneHourly(
  aboneId: number,
  year: number,
  month: number
) {
  const db = getDb();
  const [sayac] = await db
    .select()
    .from(sayaclar)
    .where(and(eq(sayaclar.aboneId, aboneId), eq(sayaclar.tip, "abone")))
    .limit(1);
  if (!sayac) return [];
  const rows = await db
    .select()
    .from(saatlikTuketim)
    .where(
      and(
        eq(saatlikTuketim.sayacId, sayac.id),
        eq(saatlikTuketim.yil, year),
        eq(saatlikTuketim.ay, month)
      )
    );
  return rows
    .sort((a, b) => a.saat - b.saat)
    .map((r) => ({
      saat: r.saat,
      label: `${String(r.saat).padStart(2, "0")}:00`,
      kwh: r.aktifKwh,
    }));
}

export async function getDashboardChartBundle(year: number, month: number) {
  const donem = `${year}-${String(month).padStart(2, "0")}`;
  const db = getDb();
  const hourly = await getHourlySystemProfile(year, month);
  const kacaklar = await getKacakTespitleriWithAbone(donem);
  const byTip = kacaklar.reduce(
    (acc, { kacak }) => {
      acc[kacak.kacakTipi] = (acc[kacak.kacakTipi] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const tipChart = Object.entries(byTip).map(([tip, count]) => ({
    tip,
    count,
  }));

  const sistem = await db
    .select()
    .from(kayipAnalizleri)
    .where(
      and(
        eq(kayipAnalizleri.seviye, "sistem"),
        eq(kayipAnalizleri.donem, donem)
      )
    )
    .limit(1);

  return { hourly, tipChart, kacakCount: kacaklar.length, sistem: sistem[0] };
}
