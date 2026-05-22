import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getSahaKpi, getSahaGorevleri } from "@/lib/db/queries-saha";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SAHA_GOREV_DURUM_LABELS } from "@/lib/db/schema";
import { Users, MapPin, ClipboardList, CheckCircle } from "lucide-react";

export default async function SahaOperasyonlariPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "saha_goruntuleme"))) {
    redirect("/dashboard");
  }

  const kpi = await getSahaKpi();
  const gorevler = (await getSahaGorevleri()).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Saha Operasyonları</h2>
        <p className="text-slate-700">
          Ekip yönetimi, görev atama ve saha takibi
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <ClipboardList className="h-4 w-4" /> Açık görev
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{kpi.acikGorev}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin className="h-4 w-4" /> Sahada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{kpi.sahadaGorev}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="h-4 w-4" /> Tamamlanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{kpi.tamamlanan}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <Users className="h-4 w-4" /> Aktif ekip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{kpi.aktifEkip}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/saha-operasyonlari/gorevler"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Tüm görevler
        </Link>
        <Link
          href="/dashboard/saha-operasyonlari/harita"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Canlı harita
        </Link>
        <Link
          href="/dashboard/saha-operasyonlari/ekipler"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Ekipler
        </Link>
        <Link
          href="/dashboard/saha-operasyonlari/personel"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Personel
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son görevler</CardTitle>
        </CardHeader>
        <CardContent>
          {gorevler.length === 0 ? (
            <p className="text-sm text-slate-700">
              Görev yok. Kaçak tespit sayfasından görev oluşturun veya migrate-v4
              çalıştırın.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {gorevler.map(({ gorev, aboneNo, aboneAd, aboneSoyad, ekipAd }) => (
                <li key={gorev.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/dashboard/saha-operasyonlari/gorevler/${gorev.id}`}
                      className="font-medium text-sky-600 hover:underline"
                    >
                      #{gorev.id} — {aboneNo}
                    </Link>
                    <p className="text-sm text-slate-700">
                      {aboneAd} {aboneSoyad} · {ekipAd}
                    </p>
                  </div>
                  <Badge variant={gorev.durum === "sahada" ? "danger" : "default"}>
                    {SAHA_GOREV_DURUM_LABELS[gorev.durum] ?? gorev.durum}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
