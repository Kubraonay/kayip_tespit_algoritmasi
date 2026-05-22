import { Users, Gauge, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export function KpiCards({
  aboneCount,
  sayacCount,
  eGiris,
  oran,
  kritikCount,
}: {
  aboneCount: number;
  sayacCount: number;
  eGiris: number;
  oran: number;
  kritikCount: number;
}) {
  const cards = [
    {
      title: "Aktif Abone",
      value: formatNumber(aboneCount),
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      title: "Sayaç",
      value: formatNumber(sayacCount),
      icon: Gauge,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Trafo Giriş (kWh)",
      value: formatNumber(eGiris),
      icon: Zap,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Kayıp Oranı",
      value: `%${formatNumber(oran, 1)}`,
      icon: AlertTriangle,
      color: oran > 15 ? "text-red-600" : "text-emerald-600",
      bg: oran > 15 ? "bg-red-50" : "bg-emerald-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                {c.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${c.bg}`}>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              {c.title === "Kayıp Oranı" && kritikCount > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  {kritikCount} kritik alarm
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
