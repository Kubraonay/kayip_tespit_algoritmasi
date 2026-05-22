import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sayaclar, aboneler } from "@/lib/db/schema";
import { paginate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { TuketimForm } from "@/components/forms/tuketim-form";
import { SayacForm } from "@/components/forms/sayac-form";

const PAGE_SIZE = 12;

const tipLabel: Record<string, string> = {
  abone: "Abone",
  bolgesel: "Bölgesel",
  trafo_giris: "Trafo Giriş",
  trafo_cikis: "Trafo Çıkış",
  fider_giris: "Fider Giriş",
};

export default async function SayaclarPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const db = getDb();
  const listAll = await db
    .select({
      sayac: sayaclar,
      aboneNo: aboneler.aboneNo,
    })
    .from(sayaclar)
    .leftJoin(aboneler, eq(sayaclar.aboneId, aboneler.id));

  const { data: list, totalPages, total, page: safePage } = paginate(
    listAll,
    page,
    PAGE_SIZE
  );

  const allSayaclar = await db.select().from(sayaclar);
  const aboneList = await db.select().from(aboneler);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sayaçlar</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sayaç Listesi ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-700">
                    <th className="pb-3 pr-4">Seri No</th>
                    <th className="pb-3 pr-4">Tip</th>
                    <th className="pb-3 pr-4">Abone</th>
                    <th className="pb-3">Marka</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(({ sayac, aboneNo }) => (
                    <tr key={sayac.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium">{sayac.seriNo}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="info">
                          {tipLabel[sayac.tip] ?? sayac.tip}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{aboneNo ?? "—"}</td>
                      <td className="py-3">{sayac.marka ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aylık Tüketim Girişi</CardTitle>
            </CardHeader>
            <CardContent>
              <TuketimForm sayaclar={allSayaclar} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Yeni Sayaç</CardTitle>
            </CardHeader>
            <CardContent>
              <SayacForm aboneler={aboneList} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
