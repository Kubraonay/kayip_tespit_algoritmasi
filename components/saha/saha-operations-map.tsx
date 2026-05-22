"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import type { SahaMapGorev, SahaMapKonum } from "@/components/saha/saha-map-inner";

const SahaMapInner = dynamic(
  () => import("./saha-map-inner").then((m) => m.SahaMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-700">
        Harita yükleniyor…
      </div>
    ),
  }
);

export function SahaOperationsMap({ canSimulate }: { canSimulate: boolean }) {
  const [gorevler, setGorevler] = useState<SahaMapGorev[]>([]);
  const [konumlar, setKonumlar] = useState<SahaMapKonum[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/saha/konumlar");
    if (!res.ok) return;
    const data = await res.json();
    setGorevler(
      (data.gorevler ?? []).map(
        (r: {
          gorev: {
            id: number;
            hedefEnlem: number | null;
            hedefBoylam: number | null;
            durum: string;
          };
          aboneNo: string;
          aboneAd: string;
          aboneSoyad: string;
          ekipAd: string;
        }) => ({
          id: r.gorev.id,
          hedefEnlem: r.gorev.hedefEnlem ?? 36.88,
          hedefBoylam: r.gorev.hedefBoylam ?? 30.7,
          durum: r.gorev.durum,
          aboneNo: r.aboneNo,
          aboneAd: r.aboneAd,
          aboneSoyad: r.aboneSoyad,
          ekipAd: r.ekipAd,
        })
      )
    );
    setKonumlar(
      (data.konumlar ?? []).map(
        (k: {
          personelId: number;
          personelAd: string | null;
          enlem: number;
          boylam: number;
          kaynak: string;
          gorevDurum: string | null;
          aboneNo: string | null;
        }) => ({
          personelId: k.personelId,
          personelAd: k.personelAd,
          enlem: k.enlem,
          boylam: k.boylam,
          kaynak: k.kaynak,
          gorevDurum: k.gorevDurum,
          aboneNo: k.aboneNo,
        })
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function simulate() {
    await fetch("/api/saha/simulate");
    load();
  }

  const center: [number, number] =
    konumlar.length > 0
      ? [konumlar[0].enlem, konumlar[0].boylam]
      : gorevler.length > 0
        ? [gorevler[0].hedefEnlem, gorevler[0].hedefBoylam]
        : [36.88, 30.7];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-orange-500" /> Hedef abone
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-sky-600" /> Ekip GPS
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-violet-500" /> Simülasyon
        </span>
        {canSimulate && (
          <Button type="button" size="sm" variant="outline" onClick={simulate}>
            Simülasyonu güncelle
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={load}>
          Yenile
        </Button>
      </div>
      {loading ? (
        <div className="h-[480px] animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <SahaMapInner gorevler={gorevler} konumlar={konumlar} center={center} />
      )}
    </div>
  );
}
