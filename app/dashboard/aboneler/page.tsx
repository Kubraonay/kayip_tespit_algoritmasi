import Link from "next/link";
import { getAbonelerWithRelations } from "@/lib/db/queries";
import { getDb } from "@/lib/db";
import { trafoMerkezleri, fiderler } from "@/lib/db/schema";
import { paginate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { AboneForm } from "@/components/forms/abone-form";

const PAGE_SIZE = 10;

export default async function AbonelerPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const rows = await getAbonelerWithRelations();
  const { data, totalPages, total, page: safePage } = paginate(
    rows,
    page,
    PAGE_SIZE
  );
  const db = getDb();
  const trafolar = await db.select().from(trafoMerkezleri);
  const fiderList = await db.select().from(fiderler);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Aboneler</h2>
        <p className="text-slate-700">{total} kayıt</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Abone Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-700">
                    <th className="pb-3 pr-4">Abone No</th>
                    <th className="pb-3 pr-4">Ad Soyad</th>
                    <th className="pb-3 pr-4">Trafo / Fider</th>
                    <th className="pb-3 pr-4">Tarife</th>
                    <th className="pb-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(({ abone, trafoKod, fiderKod }) => (
                    <tr key={abone.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/dashboard/aboneler/${abone.id}`}
                          className="font-medium text-sky-600 hover:underline"
                        >
                          {abone.aboneNo}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {abone.ad} {abone.soyad}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {trafoKod ?? "—"} / {fiderKod ?? "—"}
                      </td>
                      <td className="py-3 pr-4">{abone.tarifeGrubu}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            abone.durum === "aktif" ? "success" : "default"
                          }
                        >
                          {abone.durum}
                        </Badge>
                      </td>
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

        <Card>
          <CardHeader>
            <CardTitle>Yeni Abone</CardTitle>
          </CardHeader>
          <CardContent>
            <AboneForm trafolar={trafolar} fiderler={fiderList} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
