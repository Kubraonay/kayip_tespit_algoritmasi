/** EPDK Kayıp Katsayıları Metodolojisi - Genleşmeli/Hermetik trafo Pb/Pcu (kW) */
export const EPDK_TRAFO_KAYIPLARI: {
  pnKva: number;
  pbKw: number;
  pcuKw: number;
}[] = [
  { pnKva: 50, pbKw: 0.19, pcuKw: 1.1 },
  { pnKva: 100, pbKw: 0.32, pcuKw: 1.75 },
  { pnKva: 160, pbKw: 0.46, pcuKw: 2.35 },
  { pnKva: 250, pbKw: 0.65, pcuKw: 3.25 },
  { pnKva: 400, pbKw: 0.93, pcuKw: 4.6 },
  { pnKva: 630, pbKw: 1.3, pcuKw: 6.5 },
  { pnKva: 800, pbKw: 1.5, pcuKw: 8.5 },
  { pnKva: 1000, pbKw: 1.7, pcuKw: 10.5 },
  { pnKva: 1250, pbKw: 2.1, pcuKw: 13.0 },
  { pnKva: 1600, pbKw: 2.6, pcuKw: 17.0 },
];

export function lookupTrafoLosses(
  pnKva: number,
  customPb?: number | null,
  customPcu?: number | null
): { pb: number; pcu: number } {
  if (customPb != null && customPcu != null) {
    return { pb: customPb, pcu: customPcu };
  }
  let best = EPDK_TRAFO_KAYIPLARI[0];
  let minDiff = Math.abs(pnKva - best.pnKva);
  for (const row of EPDK_TRAFO_KAYIPLARI) {
    const diff = Math.abs(pnKva - row.pnKva);
    if (diff < minDiff) {
      minDiff = diff;
      best = row;
    }
  }
  return { pb: best.pbKw, pcu: best.pcuKw };
}

/** Bakır özdirenç (Ω·mm²/m) - Alüminyum ~0.028, Bakır ~0.0175 */
export const COPPER_RHO = 0.0175;
