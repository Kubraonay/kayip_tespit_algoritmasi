"use client";

import {
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function HourlyLoadChart({
  data,
  title,
}: {
  data: {
    label: string;
    kwh: number;
    aboneOrt?: number;
  }[];
  title?: string;
}) {
  return (
    <div className="w-full">
      {title && (
        <p className="mb-3 text-sm font-medium text-slate-800">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#334155" }}
            interval={2}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "kWh",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#334155" },
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            formatter={(value, name) => [
              `${Number(value).toFixed(2)} kWh`,
              name === "kwh" ? "Sistem toplamı" : "Abone ort.",
            ]}
            labelFormatter={(l) => `Saat: ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(v) =>
              v === "kwh" ? "Sistem toplamı (saatlik)" : "Abone ortalaması"
            }
          />
          <Area
            type="monotone"
            dataKey="kwh"
            fill="url(#hourlyGrad)"
            stroke="#0284c7"
            strokeWidth={2}
            name="kwh"
          />
          {data[0]?.aboneOrt != null && (
            <Line
              type="monotone"
              dataKey="aboneOrt"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="aboneOrt"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KacakTipChart({
  data,
}: {
  data: { tip: string; count: number; label: string }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-700">
        Kaçak tespiti verisi yok
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={115} />
        <Tooltip />
        <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Tespit" />
      </BarChart>
    </ResponsiveContainer>
  );
}
