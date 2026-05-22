"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlarmToast } from "@/components/alarmlar/toast-provider";
import {
  ALARM_TIPI_LABELS,
  ALARM_SEVIYE_LABELS,
  type AlarmSeviye,
} from "@/lib/db/schema";
import { SEVIYE_STYLES } from "@/lib/alarmlar/constants";

type LiveAlarm = {
  id: number;
  tip: string;
  seviye: AlarmSeviye;
  baslik: string;
  aciklama: string;
  aboneNo: string | null;
  okundu: boolean;
  createdAt: string;
};

const POLL_MS = 12000;

export function AlarmNotificationCenter() {
  const router = useRouter();
  const { showToast } = useAlarmToast();
  const [open, setOpen] = useState(false);
  const [alarms, setAlarms] = useState<LiveAlarm[]>([]);
  const [kpi, setKpi] = useState({ kritik: 0, orta: 0, dusuk: 0, okunmamis: 0 });
  const lastPollRef = useRef(new Date().toISOString());
  const seenIdsRef = useRef<Set<number>>(new Set());

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/alarmlar/live?since=${encodeURIComponent(lastPollRef.current)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      lastPollRef.current = data.serverTime ?? new Date().toISOString();
      setKpi(data.kpi ?? kpi);

      const incoming: LiveAlarm[] = data.alarms ?? [];
      if (incoming.length > 0) {
        setAlarms((prev) => {
          const merged = [...incoming, ...prev];
          const byId = new Map<number, LiveAlarm>();
          for (const a of merged) byId.set(a.id, a);
          return Array.from(byId.values()).slice(0, 30);
        });

        for (const a of incoming) {
          if (!seenIdsRef.current.has(a.id)) {
            seenIdsRef.current.add(a.id);
            showToast({
              id: a.id,
              seviye: a.seviye,
              baslik: a.baslik,
              aciklama: a.aciklama,
              aboneNo: a.aboneNo,
              tip: a.tip,
            });
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(a.baslik, {
                body: a.aciklama.slice(0, 120),
                tag: `alarm-${a.id}`,
              });
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, [showToast]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const unread = kpi.okunmamis;

  return (
    <div className="relative flex items-center gap-2">
      <Link
        href="/dashboard/bildirimler/canli"
        className="hidden items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 sm:flex"
      >
        <Radio className="h-3.5 w-3.5 animate-pulse" />
        Canlı
      </Link>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
        aria-label="Alarmlar ve bildirimler"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
              <h3 className="font-semibold">Canlı Bildirimler</h3>
              <div className="mt-2 flex gap-2 text-[10px]">
                <span className="rounded bg-red-600 px-1.5 py-0.5">
                  {kpi.kritik} kritik
                </span>
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-amber-950">
                  {kpi.orta} orta
                </span>
                <span className="rounded bg-sky-500 px-1.5 py-0.5">
                  {kpi.dusuk} düşük
                </span>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alarms.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-700">
                  Yeni alarm bekleniyor…
                </p>
              ) : (
                alarms.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/dashboard/alarm-merkezi?alarm=${a.id}`);
                    }}
                    className={cn(
                      "flex w-full gap-2 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                      !a.okundu && SEVIYE_STYLES[a.seviye].bg
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        SEVIYE_STYLES[a.seviye].dot
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {a.baslik}
                      </p>
                      <p className="text-xs text-slate-600">
                        {ALARM_TIPI_LABELS[a.tip as keyof typeof ALARM_TIPI_LABELS] ?? a.tip}{" "}
                        · {ALARM_SEVIYE_LABELS[a.seviye]}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {new Date(a.createdAt).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 border-t border-slate-100 p-2">
              <Link
                href="/dashboard/alarm-merkezi"
                className="rounded-lg py-2 text-center text-xs font-medium text-sky-600 hover:bg-sky-50"
                onClick={() => setOpen(false)}
              >
                Alarm Merkezi
              </Link>
              <Link
                href="/dashboard/bildirimler/gecmis"
                className="rounded-lg py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Geçmiş
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
