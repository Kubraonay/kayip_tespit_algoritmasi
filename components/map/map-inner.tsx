"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapAbone } from "@/lib/db/queries-extended";
import { useEffect } from "react";

function FitBounds({ aboneler }: { aboneler: MapAbone[] }) {
  const map = useMap();
  useEffect(() => {
    if (aboneler.length === 0) return;
    const lats = aboneler.map((a) => a.enlem);
    const lngs = aboneler.map((a) => a.boylam);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], maxZoom: 14 }
    );
  }, [aboneler, map]);
  return null;
}

export function MapInner({
  aboneler,
  center,
  selectedId,
  onSelect,
}: {
  aboneler: MapAbone[];
  center: [number, number];
  selectedId?: number;
  onSelect: (a: MapAbone) => void;
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-[420px] w-full rounded-none z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds aboneler={aboneler} />
      {aboneler.map((a) => {
        const isKacak = a.kacak;
        const isSelected = a.id === selectedId;
        const color = isKacak
          ? a.kacakDurum === "kritik"
            ? "#dc2626"
            : "#f97316"
          : "#0284c7";
        const radius = isSelected ? 12 : isKacak ? 10 : 7;
        return (
          <CircleMarker
            key={a.id}
            center={[a.enlem, a.boylam]}
            radius={radius}
            pathOptions={{
              color: isSelected ? "#1e293b" : color,
              fillColor: color,
              fillOpacity: isKacak ? 0.85 : 0.55,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelect(a),
            }}
          >
            <Popup>
              <strong>
                {a.ad} {a.soyad}
              </strong>
              <br />
              {a.aboneNo}
              {isKacak && (
                <>
                  <br />
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    Kaçak tespiti
                  </span>
                </>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
