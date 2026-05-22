"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ALARM_TIPI_LABELS,
  ALARM_SEVIYE_LABELS,
  type Alarm,
} from "@/lib/db/schema";
import { SEVIYE_STYLES } from "@/lib/alarmlar/constants";
import { markAlarmRead, markAlarmResolved } from "@/lib/actions/alarmlar";
import { Button } from "@/components/ui/button";

export function AlarmCard({
  alarm,
  canManage,
}: {
  alarm: Alarm;
  canManage: boolean;
}) {
  const seviye = alarm.seviye as keyof typeof SEVIYE_STYLES;
  const style = SEVIYE_STYLES[seviye] ?? SEVIYE_STYLES.dusuk;

  async function okundu() {
    await markAlarmRead(alarm.id);
    window.location.reload();
  }

  async function coz() {
    await markAlarmResolved(alarm.id);
    window.location.reload();
  }

  return (
    <article
      className={cn(
        "rounded-xl border p-4 transition-shadow hover:shadow-md",
        style.border,
        style.bg,
        !alarm.okundu && "ring-2 ring-offset-1 ring-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
          <span className={cn("text-xs font-bold uppercase", style.text)}>
            {ALARM_SEVIYE_LABELS[alarm.seviye as keyof typeof ALARM_SEVIYE_LABELS]}
          </span>
          <span className="text-xs text-slate-600">
            {ALARM_TIPI_LABELS[alarm.tip as keyof typeof ALARM_TIPI_LABELS] ?? alarm.tip}
          </span>
        </div>
        <time className="text-[10px] text-slate-500">
          {new Date(alarm.createdAt).toLocaleString("tr-TR")}
        </time>
      </div>
      <h3 className={cn("mt-2 font-semibold", style.text)}>{alarm.baslik}</h3>
      <p className="mt-1 text-sm text-slate-800">{alarm.aciklama}</p>
      {alarm.aboneNo && (
        <p className="mt-2 text-xs font-medium text-slate-700">
          Abone: {alarm.aboneNo}
          {alarm.sayacSeri && ` · Sayaç ${alarm.sayacSeri}`}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {!alarm.okundu && (
          <Button type="button" size="sm" variant="outline" onClick={okundu}>
            Okundu
          </Button>
        )}
        {canManage && alarm.durum === "aktif" && (
          <Button type="button" size="sm" variant="outline" onClick={coz}>
            Çözüldü
          </Button>
        )}
        {alarm.aboneId && (
          <Link
            href={`/dashboard/kacak-tespit`}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-sky-600 hover:bg-white"
          >
            İncele
          </Link>
        )}
      </div>
    </article>
  );
}
