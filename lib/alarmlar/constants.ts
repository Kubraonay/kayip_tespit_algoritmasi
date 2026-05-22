import type { AlarmSeviye, AlarmTipi } from "@/lib/db/schema";

export const ALARM_TIP_SEVIYE: Record<AlarmTipi, AlarmSeviye> = {
  ani_tuketim_artisi: "kritik",
  sayac_enerjisiz: "kritik",
  muhur_acildi: "kritik",
  ters_baglanti: "orta",
  faz_kaybi: "orta",
  sayac_offline: "dusuk",
};

export const SEVIYE_STYLES: Record<
  AlarmSeviye,
  { bg: string; border: string; text: string; dot: string }
> = {
  kritik: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    dot: "bg-red-500",
  },
  orta: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    dot: "bg-amber-500",
  },
  dusuk: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    dot: "bg-sky-500",
  },
};
