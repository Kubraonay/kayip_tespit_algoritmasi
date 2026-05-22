import { getKacakTespitleriWithAbone, parseIspatlar } from "@/lib/db/queries-extended";
import { KACAK_TIPI_LABELS } from "@/lib/db/schema";
import { paginate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { RunAnalysisButton } from "@/components/analiz/run-analysis-button";
import { KacakDetailPanel } from "@/components/kacak/kacak-detail-panel";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 8;

export default async function KacakTespitPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; id?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const selectedId = sp.id ? Number(sp.id) : null;
  const year = 2025;
  const month = 12;
  const donem = `${year}-${String(month).padStart(2, "0")}`;

  const all = await getKacakTespitleriWithAbone(donem);
  const { data, totalPages, total, page: safePage } = paginate(
    all,
    page,
    PAGE_SIZE
  );

  const selected = selectedId
    ? all.find((r) => r.kacak.id === selectedId) ?? data[0]
    : data[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Kaçak Tespit</h2>
          <p className="text-slate-700">
            Tespit tipi, ispatlar, özel notlar ve saha kayıtları — {donem}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/loglar"
            className="text-sm text-sky-600 hover:underline"
          >
            İşlem logları
          </Link>
          <RunAnalysisButton year={year} month={month} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tespit Listesi ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-700">
                Tespit yok. Analizi çalıştırın.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.map(({ kacak, abone }) => (
                  <li key={kacak.id}>
                    <Link
                      href={`/dashboard/kacak-tespit?page=${safePage}&id=${kacak.id}`}
                      className={`block rounded-lg border p-3 transition-colors ${
                        selected?.kacak.id === kacak.id
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 hover:border-red-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {abone.aboneNo}
                          </p>
                          <p className="text-sm text-slate-700">
                            {abone.ad} {abone.soyad}
                          </p>
                          <p className="mt-1 text-xs text-red-700">
                            {KACAK_TIPI_LABELS[kacak.kacakTipi]}
                          </p>
                        </div>
                        <Badge
                          variant={
                            kacak.durum === "kritik" ? "danger" : "warning"
                          }
                        >
                          {kacak.durum}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-700">
                        Güven: %{kacak.guvenSkoru.toFixed(0)} · Tahmini kayıp:{" "}
                        {formatNumber(kacak.tahminiKayipKwh ?? 0)} kWh
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {selected ? (
            <KacakDetailPanel
              kacak={selected.kacak}
              abone={selected.abone}
              trafoKod={selected.trafoKod}
              fiderKod={selected.fiderKod}
              ispatlar={parseIspatlar(selected.kacak.ispatlar)}
              year={year}
              month={month}
            />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-slate-700">
                Listeden bir tespit seçin
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
