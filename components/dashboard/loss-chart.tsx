"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export function LossTrendChart({
  data,
}: {
  data: { donem: string; oran: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-700">
        Analiz çalıştırıldığında trend görünecek
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="donem" tick={{ fontSize: 12, fill: "#334155" }} />
        <YAxis tick={{ fontSize: 12, fill: "#334155" }} unit="%" />
        <Tooltip formatter={(v) => [`%${Number(v).toFixed(1)}`, "Kayıp Oranı"]} />
        <Line
          type="monotone"
          dataKey="oran"
          stroke="#0284c7"
          strokeWidth={2}
          dot={{ fill: "#0284c7" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrafoCompareChart({
  data,
}: {
  data: { name: string; oran: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-700">Veri yok</p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "#334155" }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#334155" }} width={75} />
        <Tooltip formatter={(v) => [`%${Number(v).toFixed(1)}`, "Oran"]} />
        <Bar dataKey="oran" fill="#f97316" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
