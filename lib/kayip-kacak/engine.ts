import { lookupTrafoLosses, COPPER_RHO } from "./epdk-tables";

const COS_PHI = 0.95;
const DEFAULT_HOURS = 720;

export type BalanceResult = {
  eGiris: number;
  eCikis: number;
  eBolgesel: number;
  eAboneToplam: number;
  deltaE: number;
  oranYuzde: number;
  eTeknik: number;
  eTeknikOlmayan: number;
  durum: "normal" | "uyari" | "kritik";
};

export type TechnicalLossResult = {
  tkk: number;
  eTeknikKwh: number;
  pb: number;
  pcu: number;
  deltaPKw: number;
};

export type AnomalyResult = {
  aboneId: number;
  currentKwh: number;
  avgKwh: number;
  sapmaYuzde: number;
  durum: "normal" | "uyari" | "kritik";
};

export function computeTKK(
  eKwh: number,
  pnKva: number,
  pb: number,
  pcu: number,
  hours: number = DEFAULT_HOURS
): number {
  if (eKwh <= 0) return 0;
  const loadFactor = eKwh / (pnKva * hours * COS_PHI);
  return (pb + pcu * loadFactor * loadFactor) / eKwh;
}

export function computeTrafoTechnicalLoss(
  eKwh: number,
  pnKva: number,
  pb?: number | null,
  pcu?: number | null,
  hours: number = DEFAULT_HOURS
): TechnicalLossResult {
  const losses = lookupTrafoLosses(pnKva, pb, pcu);
  const loadFactor = eKwh > 0 ? eKwh / (pnKva * hours * COS_PHI) : 0;
  const deltaPKw = losses.pb + losses.pcu * loadFactor * loadFactor;
  const eTeknikKwh = deltaPKw * hours;
  const tkk = computeTKK(eKwh, pnKva, losses.pb, losses.pcu, hours);
  return {
    tkk,
    eTeknikKwh,
    pb: losses.pb,
    pcu: losses.pcu,
    deltaPKw,
  };
}

export function computeHKK(
  eKwh: number,
  rho: number,
  lengthM: number,
  sectionMm2: number,
  voltageKv: number,
  circuitCount: number = 1,
  hours: number = DEFAULT_HOURS
): number {
  if (eKwh <= 0 || sectionMm2 <= 0) return 0;
  const unSquared = voltageKv * voltageKv;
  return (rho * lengthM * eKwh) / (sectionMm2 * unSquared * circuitCount * hours * COS_PHI);
}

export function computeHatTechnicalLossKwh(
  eKwh: number,
  lengthM: number,
  sectionMm2: number,
  voltageKv: number = 0.4,
  hours: number = DEFAULT_HOURS
): number {
  const hkk = computeHKK(eKwh, COPPER_RHO, lengthM, sectionMm2, voltageKv, 1, hours);
  return hkk * eKwh;
}

export function computeFeederBalance(
  eGiris: number,
  eTrafoCikis: number,
  eBolgesel: number,
  eAboneToplam: number,
  eTeknikBeklenen: number,
  hedefOran: number = 12
): BalanceResult {
  const deltaE = eGiris - eTrafoCikis - eBolgesel - eAboneToplam;
  const oranYuzde = eGiris > 0 ? (deltaE / eGiris) * 100 : 0;
  const eTeknikOlmayan = Math.max(0, deltaE - eTeknikBeklenen);
  let durum: "normal" | "uyari" | "kritik" = "normal";
  if (oranYuzde > hedefOran * 1.5) durum = "kritik";
  else if (oranYuzde > hedefOran) durum = "uyari";
  return {
    eGiris,
    eCikis: eTrafoCikis,
    eBolgesel,
    eAboneToplam,
    deltaE,
    oranYuzde,
    eTeknik: eTeknikBeklenen,
    eTeknikOlmayan,
    durum,
  };
}

export function computeSystemLossRate(
  eGiris: number,
  eFaturalanan: number,
  eTeknik: number,
  hedefOran: number = 15
): {
  oranYuzde: number;
  eTeknikOlmayan: number;
  durum: "normal" | "uyari" | "kritik";
} {
  const delta = eGiris - eFaturalanan;
  const oranYuzde = eGiris > 0 ? (delta / eGiris) * 100 : 0;
  const eTeknikOlmayan = Math.max(0, delta - eTeknik);
  let durum: "normal" | "uyari" | "kritik" = "normal";
  if (oranYuzde > hedefOran * 1.3) durum = "kritik";
  else if (oranYuzde > hedefOran) durum = "uyari";
  return { oranYuzde, eTeknikOlmayan, durum };
}

export function detectSubscriberAnomaly(
  currentKwh: number,
  historyKwh: number[],
  thresholdPercent: number = 40
): AnomalyResult & { avgKwh: number } {
  const avgKwh =
    historyKwh.length > 0
      ? historyKwh.reduce((a, b) => a + b, 0) / historyKwh.length
      : currentKwh;
  const sapmaYuzde =
    avgKwh > 0 ? ((currentKwh - avgKwh) / avgKwh) * 100 : 0;
  let durum: "normal" | "uyari" | "kritik" = "normal";
  if (sapmaYuzde > thresholdPercent * 1.5) durum = "kritik";
  else if (sapmaYuzde > thresholdPercent) durum = "uyari";
  return {
    aboneId: 0,
    currentKwh,
    avgKwh,
    sapmaYuzde,
    durum,
  };
}

export function trafoDeltaP(
  p0: number,
  pk: number,
  beta: number,
  kt: number = 1
): number {
  return p0 + kt * beta * beta * pk;
}
