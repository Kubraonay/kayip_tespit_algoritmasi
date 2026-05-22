"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlarmCard } from "@/components/alarmlar/alarm-card";
import { useAlarmToast } from "@/components/alarmlar/toast-provider";
import type { Alarm, AlarmSeviye } from "@/lib/db/schema";

export function LiveAlarmFeed({ canManage }: { canManage: boolean }) {
  const { showToast } = useAlarmToast();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const lastRef = useRef<string>(new Date().toISOString());
  const seenRef = useRef<Set<number>>(new Set());

  const poll = useCallback(async () => {
    const res = await fetch(
      `/api/alarmlar/live?since=${encodeURIComponent(lastRef.current)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    lastRef.current = data.serverTime;
    const incoming = (data.alarms ?? []) as (Alarm & {
      createdAt: string;
      cozulmeAt: string | null;
    })[];
    if (incoming.length === 0) return;

    const parsed: Alarm[] = incoming.map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      cozulmeAt: a.cozulmeAt ? new Date(a.cozulmeAt) : null,
    }));

    setAlarms((prev) => {
      const m = new Map<number, Alarm>();
      for (const a of [...parsed, ...prev]) m.set(a.id, a);
      return Array.from(m.values()).slice(0, 40);
    });

    for (const a of parsed) {
      if (!seenRef.current.has(a.id)) {
        seenRef.current.add(a.id);
        showToast({
          id: a.id,
          seviye: a.seviye as AlarmSeviye,
          baslik: a.baslik,
          aciklama: a.aciklama,
          aboneNo: a.aboneNo,
          tip: a.tip,
        });
      }
    }
  }, [showToast]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 10000);
    return () => clearInterval(t);
  }, [poll]);

  if (alarms.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-slate-700">
        Canlı akış bekleniyor… Alarm taraması çalıştırın veya yeni olay oluşmasını bekleyin.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {alarms.map((a) => (
        <AlarmCard key={a.id} alarm={a} canManage={canManage} />
      ))}
    </div>
  );
}
