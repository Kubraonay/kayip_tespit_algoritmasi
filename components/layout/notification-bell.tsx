"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type KacakNotification = {
  id: string;
  kacakId: number | null;
  aboneNo: string;
  adSoyad: string;
  tip: string;
  durum: string;
  trafoKod?: string | null;
  donem: string;
  guvenSkoru: number;
  createdAt: string;
  read?: boolean;
  simulated?: boolean;
};

const INTERVAL_MS = 2 * 60 * 1000;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<KacakNotification[]>([]);
  const [toast, setToast] = useState<KacakNotification | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unread = items.filter((n) => !n.read).length;

  const pushNotification = useCallback((n: KacakNotification) => {
    const entry = { ...n, read: false };
    setItems((prev) => [entry, ...prev].slice(0, 20));
    setToast(entry);
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, []);

  const fetchRandom = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/random-kacak");
      if (!res.ok) return;
      const data = (await res.json()) as KacakNotification;
      pushNotification(data);
    } catch {
      /* ignore */
    }
  }, [pushNotification]);

  useEffect(() => {
    fetchRandom();
    intervalRef.current = setInterval(fetchRandom, INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRandom]);

  function handleClick(n: KacakNotification) {
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
    );
    setOpen(false);
    if (n.kacakId) {
      router.push(`/dashboard/kacak-tespit?id=${n.kacakId}`);
    } else {
      router.push("/dashboard/kacak-tespit");
    }
  }

  return (
    <>
      {toast && (
        <div
          className="fixed right-6 top-6 z-[9999] w-full max-w-sm shadow-2xl"
          role="alert"
        >
          <button
            type="button"
            onClick={() => handleClick(toast)}
            className="flex w-full gap-3 rounded-xl border border-red-200 bg-white p-4 text-left shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">
                Yeni kaçak tespiti
              </p>
              <p className="mt-0.5 truncate text-sm text-slate-700">
                {toast.aboneNo} — {toast.adSoyad}
              </p>
              <p className="mt-1 text-xs text-slate-700">{toast.tip}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="text-slate-700 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </button>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
          aria-label="Bildirimler"
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
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="font-semibold text-slate-900">Bildirimler</h3>
                <span className="text-xs text-slate-700">
                  Her 2 dk yeni tespit simülasyonu
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-700">
                    Henüz bildirim yok
                  </p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        "flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                        !n.read && "bg-red-50/50"
                      )}
                    >
                      <ShieldAlert
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          n.durum === "kritik"
                            ? "text-red-600"
                            : "text-orange-500"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {n.aboneNo}
                        </p>
                        <p className="truncate text-xs text-slate-700">
                          {n.tip}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-700">
                          {new Date(n.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-slate-100 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                  }}
                  className="w-full rounded-lg py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Tümünü okundu işaretle
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
