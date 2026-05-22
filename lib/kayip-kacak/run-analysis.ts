import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  trafoMerkezleri,
  fiderler,
  aboneler,
  sayaclar,
  aylikTuketim,
  kayipAnalizleri,
  kacakTespitleri,
} from "@/lib/db/schema";
import {
  classifyKacak,
  buildIspatlar,
  buildAnlatim,
  estimateKayipKwh,
} from "./kacak-detect";
import { getSetting } from "@/lib/db/queries";
import {
  computeFeederBalance,
  computeTrafoTechnicalLoss,
  computeHatTechnicalLossKwh,
  detectSubscriberAnomaly,
  computeSystemLossRate,
} from "./engine";
import { formatPeriod } from "@/lib/utils";

export async function runFullAnalysis(year: number, month: number) {
  const db = getDb();
  const donem = formatPeriod(year, month);
  const hedefOran = parseFloat(await getSetting("hedef_kayip_orani", "12"));
  const anomaliEsik = parseFloat(await getSetting("anomali_esik_yuzde", "40"));

  await db.delete(kacakTespitleri).where(eq(kacakTespitleri.donem, donem));
  await db
    .delete(kayipAnalizleri)
    .where(eq(kayipAnalizleri.donem, donem));

  const trafolar = await db.select().from(trafoMerkezleri);
  const fiderList = await db.select().from(fiderler);
  const aboneList = await db
    .select()
    .from(aboneler)
    .where(eq(aboneler.durum, "aktif"));

  const results: (typeof kayipAnalizleri.$inferInsert)[] = [];

  for (const fider of fiderList) {
    const fiderSayac = await db
      .select()
      .from(sayaclar)
      .where(
        and(eq(sayaclar.fiderId, fider.id), eq(sayaclar.tip, "fider_giris"))
      )
      .limit(1);

    const aboneSayacIds = await db
      .select({ sayacId: sayaclar.id, aboneId: aboneler.id })
      .from(sayaclar)
      .innerJoin(aboneler, eq(sayaclar.aboneId, aboneler.id))
      .where(
        and(eq(aboneler.fiderId, fider.id), eq(sayaclar.tip, "abone"))
      );

    let eGiris = 0;
    if (fiderSayac[0]) {
      const [c] = await db
        .select()
        .from(aylikTuketim)
        .where(
          and(
            eq(aylikTuketim.sayacId, fiderSayac[0].id),
            eq(aylikTuketim.yil, year),
            eq(aylikTuketim.ay, month)
          )
        )
        .limit(1);
      eGiris = c?.aktifKwh ?? 0;
    }

    let eAbone = 0;
    for (const { sayacId } of aboneSayacIds) {
      const [c] = await db
        .select()
        .from(aylikTuketim)
        .where(
          and(
            eq(aylikTuketim.sayacId, sayacId),
            eq(aylikTuketim.yil, year),
            eq(aylikTuketim.ay, month)
          )
        )
        .limit(1);
      eAbone += c?.aktifKwh ?? 0;
    }

    const eHatTeknik = computeHatTechnicalLossKwh(
      eGiris,
      fider.hatUzunlukM ?? 500,
      fider.kesitMm2 ?? 95,
      fider.gerilimKv ?? 0.4
    );

    const balance = computeFeederBalance(
      eGiris,
      0,
      0,
      eAbone,
      eHatTeknik,
      hedefOran
    );

    results.push({
      seviye: "fider",
      referansId: fider.id,
      donem,
      eGiris: balance.eGiris,
      eCikis: balance.eCikis,
      eAboneToplam: balance.eAboneToplam,
      eTeknik: balance.eTeknik,
      eTeknikOlmayan: balance.eTeknikOlmayan,
      oranYuzde: balance.oranYuzde,
      durum: balance.durum,
      aciklama: `Fider ${fider.kod}: ΔE=${balance.deltaE.toFixed(0)} kWh`,
    });
  }

  for (const trafo of trafolar) {
    const trafoSayac = await db
      .select()
      .from(sayaclar)
      .where(
        and(eq(sayaclar.trafoId, trafo.id), eq(sayaclar.tip, "trafo_giris"))
      )
      .limit(1);

    let eGiris = 0;
    if (trafoSayac[0]) {
      const [c] = await db
        .select()
        .from(aylikTuketim)
        .where(
          and(
            eq(aylikTuketim.sayacId, trafoSayac[0].id),
            eq(aylikTuketim.yil, year),
            eq(aylikTuketim.ay, month)
          )
        )
        .limit(1);
      eGiris = c?.aktifKwh ?? 0;
    }

    const trafoFiderler = fiderList.filter((f) => f.trafoId === trafo.id);
    let eAboneToplam = 0;
    for (const fider of trafoFiderler) {
      const fiderResult = results.find(
        (r) => r.seviye === "fider" && r.referansId === fider.id
      );
      eAboneToplam += fiderResult?.eAboneToplam ?? 0;
    }

    const tech = computeTrafoTechnicalLoss(
      eGiris,
      trafo.kapasiteKva,
      trafo.pbKw,
      trafo.pcuKw
    );
    const eHatTotal = trafoFiderler.reduce(
      (sum, f) =>
        sum +
        computeHatTechnicalLossKwh(
          eGiris / Math.max(trafoFiderler.length, 1),
          f.hatUzunlukM ?? 500,
          f.kesitMm2 ?? 95,
          f.gerilimKv ?? 0.4
        ),
      0
    );
    const eTeknik = tech.eTeknikKwh + eHatTotal;

    const balance = computeFeederBalance(
      eGiris,
      0,
      0,
      eAboneToplam,
      eTeknik,
      hedefOran
    );

    results.push({
      seviye: "trafo",
      referansId: trafo.id,
      donem,
      eGiris,
      eAboneToplam,
      eTeknik,
      eTeknikOlmayan: balance.eTeknikOlmayan,
      oranYuzde: balance.oranYuzde,
      durum: balance.durum,
      aciklama: `Trafo ${trafo.kod}: TKK tabanlı teknik kayıp ${eTeknik.toFixed(0)} kWh`,
    });
  }

  const kacakRows: (typeof kacakTespitleri.$inferInsert)[] = [];
  let aboneIdx = 0;

  for (const abone of aboneList) {
    aboneIdx++;
    const aboneSayac = await db
      .select()
      .from(sayaclar)
      .where(
        and(eq(sayaclar.aboneId, abone.id), eq(sayaclar.tip, "abone"))
      )
      .limit(1);
    if (!aboneSayac[0]) continue;

    const history = await db
      .select()
      .from(aylikTuketim)
      .where(eq(aylikTuketim.sayacId, aboneSayac[0].id))
      .orderBy(aylikTuketim.yil, aylikTuketim.ay);

    const current = history.find(
      (h) => h.yil === year && h.ay === month
    );
    if (!current) continue;

    const past = history
      .filter((h) => !(h.yil === year && h.ay === month))
      .map((h) => h.aktifKwh);

    const anomaly = detectSubscriberAnomaly(
      current.aktifKwh,
      past,
      anomaliEsik
    );
    if (anomaly.durum === "normal") continue;

    results.push({
      seviye: "abone",
      referansId: abone.id,
      donem,
      eAboneToplam: current.aktifKwh,
      oranYuzde: anomaly.sapmaYuzde,
      durum: anomaly.durum,
      aciklama: `Abone ${abone.aboneNo}: ortalamadan %${anomaly.sapmaYuzde.toFixed(1)} sapma`,
    });

    const trafo = trafolar.find((t) => t.id === abone.trafoId);
    const fider = fiderList.find((f) => f.id === abone.fiderId);
    const kacakTipi = classifyKacak(
      anomaly.sapmaYuzde,
      abone.tarifeGrubu ?? "mesken",
      current.aktifKwh,
      aboneIdx
    );
    const ispatlar = buildIspatlar({
      kacakTipi,
      currentKwh: current.aktifKwh,
      avgKwh: anomaly.avgKwh,
      sapmaYuzde: anomaly.sapmaYuzde,
      aboneNo: abone.aboneNo,
      fiderKod: fider?.kod,
      trafoKod: trafo?.kod,
    });
    const { anlatim, muhendisYorumu } = buildAnlatim(
      kacakTipi,
      anomaly.sapmaYuzde
    );
    kacakRows.push({
      aboneId: abone.id,
      donem,
      kacakTipi,
      durum: anomaly.durum === "kritik" ? "kritik" : "uyari",
      guvenSkoru: Math.min(
        95,
        55 + anomaly.sapmaYuzde * 0.5 + (anomaly.durum === "kritik" ? 15 : 0)
      ),
      tahminiKayipKwh: estimateKayipKwh(
        current.aktifKwh,
        anomaly.avgKwh,
        anomaly.sapmaYuzde
      ),
      ispatlar: JSON.stringify(ispatlar),
      anlatim,
      muhendisYorumu,
    });
  }

  let totalGiris = 0;
  let totalAbone = 0;
  for (const trafo of trafolar) {
    const trafoResult = results.find(
      (r) => r.seviye === "trafo" && r.referansId === trafo.id
    );
    totalGiris += trafoResult?.eGiris ?? 0;
    totalAbone += trafoResult?.eAboneToplam ?? 0;
  }

  const eTeknikSistem = results
    .filter((r) => r.seviye === "trafo")
    .reduce((a, r) => a + (r.eTeknik ?? 0), 0);

  const system = computeSystemLossRate(
    totalGiris,
    totalAbone,
    eTeknikSistem,
    hedefOran
  );

  results.push({
    seviye: "sistem",
    referansId: null,
    donem,
    eGiris: totalGiris,
    eAboneToplam: totalAbone,
    eTeknik: eTeknikSistem,
    eTeknikOlmayan: system.eTeknikOlmayan,
    oranYuzde: system.oranYuzde,
    durum: system.durum,
    aciklama: "Sistem geneli kayıp-kaçak oranı",
  });

  if (results.length > 0) {
    await db.insert(kayipAnalizleri).values(results);
  }
  if (kacakRows.length > 0) {
    await db.insert(kacakTespitleri).values(kacakRows);
  }

  return {
    count: results.length,
    kacakCount: kacakRows.length,
    donem,
  };
}
