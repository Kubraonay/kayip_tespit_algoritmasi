import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { getIslemLoglari } from "@/lib/db/queries-logs";
import { ISLEM_TIPI_LABELS } from "@/lib/db/schema";
import { paginate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ScrollText, ExternalLink } from "lucide-react";

const PAGE_SIZE = 15;

const TIP_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  kacak_not_eklendi: "info",
  analiz_calistirildi: "warning",
  kullanici_olusturuldu: "success",
  kullanici_rol_guncellendi: "default",
  kullanici_silindi: "danger",
  abone_olusturuldu: "success",
  tuketim_guncellendi: "default",
  veri_aktarildi: "default",
};

export default async function LoglarPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tip?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const tipFilter = sp.tip || undefined;

  const all = await getIslemLoglari({
    page: 1,
    pageSize: 1000,
    islemTipi: tipFilter,
  });

  const { data, totalPages, total, page: safePage } = paginate(
    all,
    page,
    PAGE_SIZE
  );

  const session = await auth();
  const tipCounts = all.reduce(
    (acc, l) => {
      acc[l.islemTipi] = (acc[l.islemTipi] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ScrollText className="h-7 w-7 text-sky-600" />
          İşlem Logları
        </h2>
        <p className="text-slate-700">
          Kim, hangi işlemi, ne zaman yaptı — denetim izi
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/loglar"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !tipFilter
              ? "bg-sky-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Tümü ({all.length})
        </Link>
        {Object.entries(tipCounts).map(([tip, count]) => (
          <Link
            key={tip}
            href={`/dashboard/loglar?tip=${tip}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tipFilter === tip
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {ISLEM_TIPI_LABELS[tip] ?? tip} ({count})
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kayıtlar</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="py-12 text-center text-slate-700">
              Henüz log kaydı yok. Not ekledikçe veya analiz çalıştırdıkça
              burada görünecek.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-700">
                    <th className="pb-3 pr-4">Tarih</th>
                    <th className="pb-3 pr-4">Kullanıcı</th>
                    <th className="pb-3 pr-4">İşlem</th>
                    <th className="pb-3 pr-4">Açıklama</th>
                    <th className="pb-3">Bağlantı</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((log) => {
                    let detay: { aboneNo?: string; notId?: number } = {};
                    try {
                      if (log.detay) detay = JSON.parse(log.detay);
                    } catch {
                      /* ignore */
                    }
                    const linkHref =
                      log.varlikTipi === "kacak_tespit" && log.varlikId
                        ? `/dashboard/kacak-tespit?id=${log.varlikId}`
                        : null;

                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50"
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-slate-700">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString("tr-TR")
                            : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-900">
                            {log.kullaniciAd ?? "Sistem"}
                          </p>
                          {log.kullaniciId === Number(session?.user?.id) && (
                            <span className="text-xs text-sky-600">Siz</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              TIP_VARIANT[log.islemTipi] ?? "default"
                            }
                          >
                            {ISLEM_TIPI_LABELS[log.islemTipi] ??
                              log.islemTipi}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 max-w-md text-slate-700">
                          {log.aciklama}
                          {detay.aboneNo && (
                            <span className="mt-1 block text-xs text-slate-700">
                              Abone: {detay.aboneNo}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {linkHref ? (
                            <Link
                              href={linkHref}
                              className="inline-flex items-center gap-1 text-sky-600 hover:underline"
                            >
                              Görüntüle
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
  );
}
