import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getSahaGorevleri } from "@/lib/db/queries-saha";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SAHA_GOREV_DURUM_LABELS,
  SAHA_ONCELIK_LABELS,
} from "@/lib/db/schema";

export default async function SahaGorevlerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "saha_goruntuleme"))) {
    redirect("/dashboard");
  }
  const sp = await searchParams;
  const gorevler = await getSahaGorevleri(
    sp.durum ? { durum: sp.durum } : undefined
  );

  const durumlar = [
    "beklemede",
    "atandi",
    "yola_cikildi",
    "sahada",
    "inceleme",
    "tamamlandi",
    "iptal",
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Saha Görevleri</h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/saha-operasyonlari/gorevler"
          className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white"
        >
          Tümü
        </Link>
        {durumlar.map((d) => (
          <Link
            key={d}
            href={`/dashboard/saha-operasyonlari/gorevler?durum=${d}`}
            className={`rounded-full px-3 py-1 text-xs ${
              sp.durum === d
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
          >
            {SAHA_GOREV_DURUM_LABELS[d]}
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Görev listesi ({gorevler.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {gorevler.length === 0 ? (
            <p className="text-sm text-slate-700">Görev bulunamadı</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-700">
                  <th className="py-2">#</th>
                  <th>Abone</th>
                  <th>Ekip</th>
                  <th>Durum</th>
                  <th>Öncelik</th>
                </tr>
              </thead>
              <tbody>
                {gorevler.map(
                  ({
                    gorev,
                    aboneNo,
                    aboneAd,
                    aboneSoyad,
                    ekipAd,
                    personelAd,
                  }) => (
                    <tr key={gorev.id} className="border-b border-slate-50">
                      <td className="py-3">
                        <Link
                          href={`/dashboard/saha-operasyonlari/gorevler/${gorev.id}`}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          {gorev.id}
                        </Link>
                      </td>
                      <td className="text-slate-800">
                        {aboneNo}
                        <br />
                        <span className="text-slate-600">
                          {aboneAd} {aboneSoyad}
                        </span>
                      </td>
                      <td className="text-slate-700">
                        {ekipAd}
                        {personelAd && (
                          <>
                            <br />
                            <span className="text-xs">{personelAd}</span>
                          </>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={gorev.durum === "sahada" ? "danger" : "default"}
                        >
                          {SAHA_GOREV_DURUM_LABELS[gorev.durum] ?? gorev.durum}
                        </Badge>
                      </td>
                      <td className="text-slate-700">
                        {SAHA_ONCELIK_LABELS[gorev.oncelik] ?? gorev.oncelik}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
