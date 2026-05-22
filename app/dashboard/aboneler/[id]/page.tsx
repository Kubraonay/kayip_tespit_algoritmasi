import { notFound } from "next/navigation";
import Link from "next/link";
import { getAboneDetail } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { AboneTuketimChart } from "@/components/dashboard/abone-tuketim-chart";

export default async function AboneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAboneDetail(Number(id));
  if (!detail) notFound();

  const { abone, trafo, fider, sayaclar, tuketim } = detail;

  const chartData = [...tuketim]
    .sort((a, b) => a.yil - b.yil || a.ay - b.ay)
    .map((t) => ({
      donem: `${t.ay}/${t.yil}`,
      kwh: t.aktifKwh,
    }));

  return (
    <div className="space-y-6">
      <Link href="/dashboard/aboneler">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Abonelere dön
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {abone.ad} {abone.soyad}
              </CardTitle>
              <p className="mt-1 text-slate-700">Abone No: {abone.aboneNo}</p>
            </div>
            <Badge variant={abone.durum === "aktif" ? "success" : "default"}>
              {abone.durum}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-700">Adres</p>
            <p className="font-medium text-slate-900">{abone.adres ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-700">Trafo</p>
            <p className="font-medium text-slate-900">{trafo?.kod ?? "—"} — {trafo?.ad}</p>
          </div>
          <div>
            <p className="text-xs text-slate-700">Fider</p>
            <p className="font-medium text-slate-900">{fider?.kod ?? "—"} — {fider?.ad}</p>
          </div>
          <div>
            <p className="text-xs text-slate-700">Tarife Grubu</p>
            <p className="font-medium text-slate-900">{abone.tarifeGrubu}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sayaçlar</CardTitle>
          </CardHeader>
          <CardContent>
            {sayaclar.length === 0 ? (
              <p className="text-sm text-slate-700">Sayaç kaydı yok</p>
            ) : (
              <ul className="space-y-2">
                {sayaclar.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-slate-100 p-3 text-sm"
                  >
                    <span className="font-medium">{s.seriNo}</span>
                    <span className="ml-2 text-slate-700">
                      {s.tip} — {s.marka ?? "Marka yok"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aylık Tüketim Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <AboneTuketimChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüketim Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-700">
                <th className="pb-3 pr-4">Dönem</th>
                <th className="pb-3">Aktif Tüketim (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {tuketim.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    {t.ay}/{t.yil}
                  </td>
                  <td className="py-3 font-medium">
                    {formatNumber(t.aktifKwh)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
