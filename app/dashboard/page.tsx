import Link from "next/link";
import { eq, and, desc } from "drizzle-orm";
import { getDashboardStats } from "@/lib/db/queries";
import { getDashboardChartBundle } from "@/lib/db/queries-extended";
import { getDb } from "@/lib/db";
import { kayipAnalizleri, trafoMerkezleri, fiderler } from "@/lib/db/schema";
import { KACAK_TIPI_LABELS } from "@/lib/db/schema";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { LossTrendChart, TrafoCompareChart } from "@/components/dashboard/loss-chart";
import { HourlyLoadChart, KacakTipChart } from "@/components/dashboard/hourly-chart";
import { AlarmTable } from "@/components/dashboard/alarm-table";
import { AboneMapPanel } from "@/components/map/abone-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, ShieldAlert, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const year = 2025;
  const month = 12;
  const donem = `${year}-${String(month).padStart(2, "0")}`;
  const stats = await getDashboardStats(year, month);
  const charts = await getDashboardChartBundle(year, month);
  const db = getDb();

  const trafolar = await db.select().from(trafoMerkezleri);
  const fiderList = await db.select().from(fiderler);

  const sistemAnalizleri = await db
    .select()
    .from(kayipAnalizleri)
    .where(eq(kayipAnalizleri.seviye, "sistem"))
    .orderBy(desc(kayipAnalizleri.donem))
    .limit(6);

  const trendData = sistemAnalizleri
    .map((a) => ({ donem: a.donem, oran: a.oranYuzde ?? 0 }))
    .reverse();

  const trafoAnaliz = await db
    .select()
    .from(kayipAnalizleri)
    .where(
      and(
        eq(kayipAnalizleri.seviye, "trafo"),
        eq(kayipAnalizleri.donem, donem)
      )
    );

  const trafoChart = trafoAnaliz.map((a) => {
    const t = trafolar.find((tr) => tr.id === a.referansId);
    return { name: t?.kod ?? `Trafo ${a.referansId}`, oran: a.oranYuzde ?? 0 };
  });

  const tipChart = charts.tipChart.map((t) => ({
    ...t,
    label:
      KACAK_TIPI_LABELS[t.tip as keyof typeof KACAK_TIPI_LABELS] ?? t.tip,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Operasyonel Özet
          </h2>
          <p className="mt-1 max-w-2xl text-slate-700">
            {donem} dönemi için şebeke kayıp oranı, saatlik yük dağılımı ve saha
            tespit haritası. Kırmızı aboneler kaçak analizi ile işaretlenmiştir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/kacak-tespit">
            <Button variant="default">
              <ShieldAlert className="h-4 w-4" />
              Kaçak Tespitleri
            </Button>
          </Link>
          <Link href="/dashboard/kacak-tespit">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4" />
              Analiz Çalıştır
            </Button>
          </Link>
          <Link href="/dashboard/veri-aktar">
            <Button variant="outline">
              <Upload className="h-4 w-4" />
              Veri Aktar
            </Button>
          </Link>
        </div>
      </div>

      <KpiCards
        aboneCount={stats.aboneCount}
        sayacCount={stats.sayacCount}
        eGiris={stats.eGiris}
        oran={stats.oran}
        kritikCount={stats.kritikCount}
      />

      {charts.sistem && (
        <Card className="border-l-4 border-l-sky-500 bg-gradient-to-r from-sky-50/80 to-white">
          <CardContent className="flex flex-wrap items-center gap-6 py-5">
            <TrendingUp className="h-10 w-10 text-sky-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-sky-900">
                Sistem enerji bilançosu — {donem}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Giriş: {formatNumber(charts.sistem.eGiris ?? 0)} kWh · Faturalanan
                abone toplamı: {formatNumber(charts.sistem.eAboneToplam ?? 0)}{" "}
                kWh · Teknik olmayan pay:{" "}
                {formatNumber(charts.sistem.eTeknikOlmayan ?? 0)} kWh
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">
                %{(charts.sistem.oranYuzde ?? 0).toFixed(1)}
              </p>
              <p className="text-xs text-slate-700">kayıp oranı</p>
            </div>
          </CardContent>
        </Card>
      )}

      <AboneMapPanel trafolar={trafolar} fiderler={fiderList} donem={donem} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saatlik Sistem Yük Profili</CardTitle>
            <p className="text-sm text-slate-700">
              24 saatlik kWh dağılımı — abone sayaçları toplamı (referans gün:
              15/{month}/{year})
            </p>
          </CardHeader>
          <CardContent>
            <HourlyLoadChart data={charts.hourly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kaçak Tespit Türleri</CardTitle>
            <p className="text-sm text-slate-700">
              {charts.kacakCount} aktif tespit — mühendislik sınıflandırması
            </p>
          </CardHeader>
          <CardContent>
            <KacakTipChart data={tipChart} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kayıp Oranı Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <LossTrendChart data={trendData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trafo Bazlı Kayıp Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <TrafoCompareChart data={trafoChart} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Kritik ve Uyarı Alarmları</CardTitle>
          <Link href="/dashboard/kacak-tespit">
            <Button variant="ghost" size="sm">
              Tüm tespitler
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <AlarmTable alarms={stats.alarms} />
        </CardContent>
      </Card>
    </div>
  );
}
