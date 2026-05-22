"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

export type SahaMapGorev = {
  id: number;
  hedefEnlem: number;
  hedefBoylam: number;
  durum: string;
  aboneNo: string;
  aboneAd: string;
  aboneSoyad: string;
  ekipAd: string;
};

export type SahaMapKonum = {
  personelId: number;
  personelAd: string | null;
  enlem: number;
  boylam: number;
  kaynak: string;
  gorevDurum: string | null;
  aboneNo: string | null;
};

function FitAll({
  gorevler,
  konumlar,
}: {
  gorevler: SahaMapGorev[];
  konumlar: SahaMapKonum[];
}) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    gorevler.forEach((g) => {
      if (g.hedefEnlem != null && g.hedefBoylam != null) {
        pts.push([g.hedefEnlem, g.hedefBoylam]);
      }
    });
    konumlar.forEach((k) => pts.push([k.enlem, k.boylam]));
    if (pts.length === 0) return;
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [48, 48], maxZoom: 13 }
    );
  }, [gorevler, konumlar, map]);
  return null;
}

export function SahaMapInner({
  gorevler,
  konumlar,
  center,
}: {
  gorevler: SahaMapGorev[];
  konumlar: SahaMapKonum[];
  center: [number, number];
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-[480px] w-full rounded-xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OSM'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitAll gorevler={gorevler} konumlar={konumlar} />
      {gorevler.map((g) => {
        if (g.hedefEnlem == null || g.hedefBoylam == null) return null;
        return (
          <CircleMarker
            key={`g-${g.id}`}
            center={[g.hedefEnlem, g.hedefBoylam]}
            radius={9}
            pathOptions={{
              color: "#1e293b",
              fillColor: "#f97316",
              fillOpacity: 0.7,
              weight: 2,
              dashArray: "4 4",
            }}
          >
            <Popup>
              <strong>Hedef — {g.aboneNo}</strong>
              <br />
              {g.aboneAd} {g.aboneSoyad}
              <br />
              {g.ekipAd} · {g.durum}
            </Popup>
          </CircleMarker>
        );
      })}
      {konumlar.map((k) => (
        <CircleMarker
          key={`p-${k.personelId}`}
          center={[k.enlem, k.boylam]}
          radius={11}
          pathOptions={{
            color: "#fff",
            fillColor: k.kaynak === "gps" ? "#0284c7" : "#8b5cf6",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Popup>
            <strong>{k.personelAd ?? "Personel"}</strong>
            <br />
            {k.kaynak === "gps" ? "GPS" : "Simülasyon"}
            {k.aboneNo && (
              <>
                <br />
                Görev: {k.aboneNo}
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
