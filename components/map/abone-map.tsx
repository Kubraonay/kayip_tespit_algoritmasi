"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MapAbone } from "@/lib/db/queries-extended";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import Link from "next/link";
import { KACAK_TIPI_LABELS } from "@/lib/db/schema";
import type { TrafoMerkezi, Fider } from "@/lib/db/schema";

const MapContainer = dynamic(
  () => import("./map-inner").then((m) => m.MapInner),
  { ssr: false, loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-700">
      Harita yükleniyor…
    </div>
  ) }
);

export function AboneMapPanel({
  trafolar,
  fiderler,
  donem,
}: {
  trafolar: TrafoMerkezi[];
  fiderler: Fider[];
  donem: string;
}) {
  const [aboneler, setAboneler] = useState<MapAbone[]>([]);
  const [selected, setSelected] = useState<MapAbone | null>(null);
  const [loading, setLoading] = useState(true);
  const [trafoId, setTrafoId] = useState("");
  const [fiderId, setFiderId] = useState("");
  const [tarife, setTarife] = useState("");
  const [sadeceKacak, setSadeceKacak] = useState(false);
  const [search, setSearch] = useState("");

  const filteredFiderler = useMemo(
    () =>
      fiderler.filter((f) => !trafoId || f.trafoId === Number(trafoId)),
    [fiderler, trafoId]
  );

  async function loadMap() {
    setLoading(true);
    const params = new URLSearchParams({ donem });
    if (trafoId) params.set("trafoId", trafoId);
    if (fiderId) params.set("fiderId", fiderId);
    if (tarife) params.set("tarife", tarife);
    if (sadeceKacak) params.set("sadeceKacak", "1");
    const res = await fetch(`/api/map/aboneler?${params}`);
    const data = await res.json();
    setAboneler(data);
    setLoading(false);
  }

  useEffect(() => {
    loadMap();
  }, [donem, trafoId, fiderId, tarife, sadeceKacak]);

  const displayed = useMemo(() => {
    if (!search.trim()) return aboneler;
    const q = search.toLowerCase();
    return aboneler.filter(
      (a) =>
        a.aboneNo.toLowerCase().includes(q) ||
        `${a.ad} ${a.soyad}`.toLowerCase().includes(q)
    );
  }, [aboneler, search]);

  const center: [number, number] = useMemo(() => {
    if (displayed.length === 0) return [36.88, 30.7];
    const lat =
      displayed.reduce((s, a) => s + a.enlem, 0) / displayed.length;
    const lng =
      displayed.reduce((s, a) => s + a.boylam, 0) / displayed.length;
    return [lat, lng];
  }, [displayed]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-slate-50/80 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-sky-600" />
              Abone Haritası
            </CardTitle>
            <p className="mt-1 text-sm text-slate-700">
              Kırmızı işaretler: kaçak tespiti yapılan aboneler
            </p>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">
            {displayed.length} abone
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">Arama</Label>
            <Input
              placeholder="Abone no / ad"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Trafo</Label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
              value={trafoId}
              onChange={(e) => {
                setTrafoId(e.target.value);
                setFiderId("");
              }}
            >
              <option value="">Tümü</option>
              {trafolar.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.kod}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Fider</Label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
              value={fiderId}
              onChange={(e) => setFiderId(e.target.value)}
            >
              <option value="">Tümü</option>
              {filteredFiderler.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.kod}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Tarife</Label>
            <select
              className="h-9 w-full rounded-lg border border-slate-300 px-2 text-sm"
              value={tarife}
              onChange={(e) => setTarife(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="mesken">Mesken</option>
              <option value="sanayi">Sanayi</option>
              <option value="ticarethane">Ticarethane</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sadeceKacak}
                onChange={(e) => setSadeceKacak(e.target.checked)}
                className="rounded border-slate-300"
              />
              Sadece tespit
            </label>
            <Button type="button" variant="outline" size="sm" onClick={loadMap}>
              Uygula
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-0 p-0 lg:grid-cols-3">
        <div className="relative lg:col-span-2">
          {!loading && (
            <MapContainer
              aboneler={displayed}
              center={center}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          )}
          {loading && (
            <div className="flex h-[420px] items-center justify-center bg-slate-50">
              Yükleniyor…
            </div>
          )}
        </div>
        <div className="border-l border-slate-200 bg-white p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">
                  {selected.ad} {selected.soyad}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-slate-700 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-slate-700">{selected.aboneNo}</p>
              {selected.kacak ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold uppercase text-red-700">
                    Kaçak tespiti
                  </p>
                  <p className="mt-1 text-sm font-medium text-red-900">
                    {selected.kacakTipi &&
                      KACAK_TIPI_LABELS[
                        selected.kacakTipi as keyof typeof KACAK_TIPI_LABELS
                      ]}
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    Durum: {selected.kacakDurum}
                  </p>
                </div>
              ) : (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  Bu dönemde kaçak tespiti yok
                </p>
              )}
              <p className="text-xs text-slate-700">
                {selected.trafoKod} / {selected.fiderKod}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link href={`/dashboard/aboneler/${selected.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Abone detayı
                  </Button>
                </Link>
                {selected.kacakId && (
                  <Link
                    href={`/dashboard/kacak-tespit?id=${selected.kacakId}`}
                  >
                    <Button size="sm" className="w-full">
                      Kaçak raporu
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-700">
              Haritadan bir abone seçin
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
