"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

export function KacakHourlyChart({
  data,
  highlightNight = false,
}: {
  data: { label: string; kwh: number; saat?: number }[];
  highlightNight?: boolean;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-700">
        Saatlik veri yok — migrate veya analiz çalıştırın
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="kacakHour" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        {highlightNight && (
          <ReferenceArea x1="00:00" x2="05:00" fill="#fef2f2" fillOpacity={0.6} />
        )}
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#334155" }} interval={2} />
        <YAxis tick={{ fontSize: 11, fill: "#334155" }} width={45} />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(2)} kWh`, "Tüketim"]}
          labelFormatter={(l) => `Saat ${l}`}
          contentStyle={{ borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="kwh"
          stroke="#dc2626"
          fill="url(#kacakHour)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
