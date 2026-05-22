/** Tipik yük eğrisi katsayıları (24 saat, toplam = 1) */
const MESKEN = [
  0.025, 0.022, 0.02, 0.02, 0.022, 0.028, 0.04, 0.05, 0.045, 0.04, 0.038,
  0.04, 0.042, 0.04, 0.038, 0.04, 0.05, 0.065, 0.08, 0.075, 0.06, 0.05, 0.04,
  0.03,
];

const SANAYI = [
  0.02, 0.02, 0.02, 0.02, 0.025, 0.035, 0.05, 0.06, 0.065, 0.065, 0.06, 0.055,
  0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.07, 0.065, 0.055, 0.045, 0.035, 0.025,
];

export function generateHourlyFromMonthly(
  monthlyKwh: number,
  tarife: string = "mesken"
): { saat: number; kwh: number; label: string }[] {
  const curve = tarife === "sanayi" ? SANAYI : MESKEN;
  return curve.map((w, saat) => ({
    saat,
    label: `${String(saat).padStart(2, "0")}:00`,
    kwh: Math.round(monthlyKwh * w * 100) / 100,
  }));
}

export function detectNightAnomaly(
  hourly: { saat: number; kwh: number }[]
): boolean {
  const night = hourly.filter((h) => h.saat >= 0 && h.saat <= 5);
  const day = hourly.filter((h) => h.saat >= 8 && h.saat <= 18);
  const nightAvg =
    night.reduce((a, h) => a + h.kwh, 0) / Math.max(night.length, 1);
  const dayAvg =
    day.reduce((a, h) => a + h.kwh, 0) / Math.max(day.length, 1);
  return nightAvg > dayAvg * 0.45;
}
