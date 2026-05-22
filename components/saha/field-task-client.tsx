"use client";

import { useEffect, useState } from "react";
import {
  updateGorevDurumByToken,
  addGorevNotuByToken,
  saveTutanakFromToken,
} from "@/lib/actions/saha";
import { SAHA_GOREV_DURUM_LABELS, KACAK_TIPI_LABELS, type TutanakIcerik } from "@/lib/db/schema";
import { SAHA_FIELD_DURUMLAR } from "@/lib/saha/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FieldTaskClient({
  token,
  gorev,
  defaults,
}: {
  token: string;
  gorev: {
    durum: string;
    personelId: number | null;
    aboneNo: string;
    aboneAd: string;
    aboneSoyad: string;
    aboneAdres: string | null;
    ekipAd: string;
    kacakTipi: string | null;
  };
  defaults: TutanakIcerik;
}) {
  const [durum, setDurum] = useState(gorev.durum);
  const [not, setNot] = useState("");
  const [msg, setMsg] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");

  useEffect(() => {
    if (!gorev.personelId || !navigator.geolocation) {
      setGpsStatus("GPS kullanılamıyor");
      return;
    }

    const send = (pos: GeolocationPosition) => {
      fetch("/api/saha/konum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          enlem: pos.coords.latitude,
          boylam: pos.coords.longitude,
          kaynak: "gps",
        }),
      }).catch(() => {});
    };

    navigator.geolocation.getCurrentPosition(send, () => setGpsStatus("Konum alınamadı"));
    const id = navigator.geolocation.watchPosition(
      send,
      () => setGpsStatus("İzleme hatası"),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    setGpsStatus("Konum paylaşımı aktif");
    return () => navigator.geolocation.clearWatch(id);
  }, [token, gorev.personelId]);

  async function updateStatus() {
    const res = await updateGorevDurumByToken(token, durum, not || undefined);
    setMsg("error" in res && res.error ? res.error : "Durum güncellendi");
  }

  async function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const icerik = String(fd.get("icerik") ?? "");
    const res = await addGorevNotuByToken(token, icerik);
    setMsg("error" in res && res.error ? res.error : "Not eklendi");
    e.currentTarget.reset();
  }

  async function uploadPhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/saha/gorev/${token}/foto`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setMsg(data.error ?? "Fotoğraf yüklendi");
    e.currentTarget.reset();
  }

  const [tutanak, setTutanak] = useState<TutanakIcerik>(defaults);

  async function saveTutanak(e: React.FormEvent) {
    e.preventDefault();
    const res = await saveTutanakFromToken(
      token,
      tutanak,
      tutanak.imzaMetni ?? "Saha personeli"
    );
    setMsg("error" in res && res.error ? res.error : "Tutanak kaydedildi");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-12">
      <header className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <h1 className="text-lg font-bold text-slate-900">Saha Görevi</h1>
        <p className="mt-1 text-sm text-slate-800">
          {gorev.aboneNo} — {gorev.aboneAd} {gorev.aboneSoyad}
        </p>
        <p className="text-sm text-slate-700">{gorev.aboneAdres}</p>
        <p className="mt-2 text-xs text-slate-600">
          {gorev.ekipAd}
          {gorev.kacakTipi &&
            ` · ${KACAK_TIPI_LABELS[gorev.kacakTipi as keyof typeof KACAK_TIPI_LABELS] ?? gorev.kacakTipi}`}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-900">
          Durum: {SAHA_GOREV_DURUM_LABELS[gorev.durum] ?? gorev.durum}
        </p>
        <p className="text-xs text-slate-600">{gpsStatus}</p>
      </header>

      {msg && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">{msg}</p>
      )}

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Durum güncelle</h2>
        <select
          value={durum}
          onChange={(e) => setDurum(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900"
        >
          {SAHA_FIELD_DURUMLAR.map((d) => (
            <option key={d} value={d}>
              {SAHA_GOREV_DURUM_LABELS[d]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Kısa not"
          value={not}
          onChange={(e) => setNot(e.target.value)}
        />
        <Button type="button" className="w-full" onClick={updateStatus}>
          Kaydet
        </Button>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Fotoğraf</h2>
        <form onSubmit={uploadPhoto} className="space-y-2">
          <input type="file" name="file" accept="image/*" capture="environment" required />
          <Input name="aciklama" placeholder="Açıklama" />
          <Button type="submit" className="w-full">
            Yükle
          </Button>
        </form>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Saha notu</h2>
        <form onSubmit={addNote} className="space-y-2">
          <textarea
            name="icerik"
            rows={3}
            required
            className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900"
          />
          <Button type="submit" className="w-full">
            Not ekle
          </Button>
        </form>
      </section>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Dijital tutanak</h2>
        <form onSubmit={saveTutanak} className="space-y-2">
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900"
            rows={4}
            value={tutanak.sahaBulgusu}
            onChange={(e) =>
              setTutanak({ ...tutanak, sahaBulgusu: e.target.value })
            }
            placeholder="Saha bulgusu"
          />
          <Input
            value={tutanak.imzaMetni ?? ""}
            onChange={(e) => setTutanak({ ...tutanak, imzaMetni: e.target.value })}
            placeholder="İmza / ad soyad"
          />
          <Button type="submit" className="w-full">
            Tutanak kaydet
          </Button>
        </form>
      </section>
    </div>
  );
}
