"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlarmSeviye } from "@/lib/db/schema";

export type ToastAlarm = {
  id: number;
  seviye: AlarmSeviye;
  baslik: string;
  aciklama: string;
  aboneNo?: string | null;
  tip: string;
};

type ToastContextValue = {
  showToast: (alarm: ToastAlarm) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  kritik: AlertTriangle,
  orta: AlertCircle,
  dusuk: Info,
};

const styles = {
  kritik: "border-red-300 bg-red-50 text-red-950",
  orta: "border-amber-300 bg-amber-50 text-amber-950",
  dusuk: "border-sky-300 bg-sky-50 text-sky-950",
};

export function AlarmToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<(ToastAlarm & { key: string })[]>([]);

  const showToast = useCallback((alarm: ToastAlarm) => {
    const key = `${alarm.id}-${Date.now()}`;
    setQueue((prev) => [...prev.slice(-4), { ...alarm, key }]);
    setTimeout(() => {
      setQueue((prev) => prev.filter((t) => t.key !== key));
    }, 8000);
  }, []);

  const dismiss = (key: string) => {
    setQueue((prev) => prev.filter((t) => t.key !== key));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-full max-w-md flex-col gap-2"
        aria-live="polite"
      >
        {queue.map((t) => {
          const Icon = icons[t.seviye];
          return (
            <div
              key={t.key}
              className={cn(
                "pointer-events-auto animate-in slide-in-from-right rounded-xl border p-4 shadow-xl",
                styles[t.seviye]
              )}
              role="alert"
            >
              <div className="flex gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{t.baslik}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs opacity-90">
                    {t.aciklama}
                  </p>
                  {t.aboneNo && (
                    <p className="mt-1 text-[10px] font-medium opacity-75">
                      {t.aboneNo}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.key)}
                  className="shrink-0 opacity-60 hover:opacity-100"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useAlarmToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAlarmToast AlarmToastProvider içinde kullanılmalı");
  return ctx;
}
