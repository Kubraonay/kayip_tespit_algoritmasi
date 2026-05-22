import { getSebekeTree } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { SebekeForms } from "@/components/forms/sebeke-forms";

export default async function SebekePage() {
  const { trafolar, fiderler, aboneler } = await getSebekeTree();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Şebeke Yapısı</h2>
        <p className="text-slate-700">
          Trafo merkezi → Fider → Abone hiyerarşisi
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {trafolar.map((trafo) => {
            const trafoFiderler = fiderler.filter((f) => f.trafoId === trafo.id);
            return (
              <Card key={trafo.id}>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Network className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {trafo.kod} — {trafo.ad}
                    </CardTitle>
                    <p className="text-sm text-slate-700">
                      {trafo.ilce} · {trafo.kapasiteKva} kVA · {trafo.gerilimKv} kV
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pl-4">
                  {trafoFiderler.map((fider) => {
                    const fiderAboneler = aboneler.filter(
                      (a) => a.fiderId === fider.id
                    );
                    return (
                      <div
                        key={fider.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-medium text-sky-800">
                          {fider.kod} — {fider.ad}
                        </p>
                        <p className="text-xs text-slate-700">
                          Hat: {fider.hatUzunlukM}m · Kesit: {fider.kesitMm2} mm²
                        </p>
                        <ul className="mt-2 space-y-1">
                          {fiderAboneler.map((a) => (
                            <li
                              key={a.id}
                              className="text-sm text-slate-700 before:mr-2 before:content-['•']"
                            >
                              {a.aboneNo} — {a.ad} {a.soyad}
                            </li>
                          ))}
                          {fiderAboneler.length === 0 && (
                            <li className="text-sm text-slate-700">
                              Abone yok
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                  {trafoFiderler.length === 0 && (
                    <p className="text-sm text-slate-700">Fider tanımlı değil</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <SebekeForms trafolar={trafolar} />
      </div>
    </div>
  );
}
