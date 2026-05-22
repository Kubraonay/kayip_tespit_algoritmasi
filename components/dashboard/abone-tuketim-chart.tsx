"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function AboneTuketimChart({
  data,
}: {
  data: { donem: string; kwh: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-700">
        Tüketim verisi yok
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="donem" tick={{ fontSize: 11, fill: "#334155" }} />
        <YAxis tick={{ fontSize: 11, fill: "#334155" }} />
        <Tooltip formatter={(v) => [`${Number(v)} kWh`, "Tüketim"]} />
        <Area
          type="monotone"
          dataKey="kwh"
          stroke="#0284c7"
          fill="#bae6fd"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
