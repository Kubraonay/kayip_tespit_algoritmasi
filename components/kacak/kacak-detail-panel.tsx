import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  KACAK_TIPI_LABELS,
  type KacakTespiti,
  type Abone,
  type IspatKaydi,
} from "@/lib/db/schema";
import { KacakHourlyChart } from "@/components/kacak/kacak-hourly-chart";
import { getAboneHourly } from "@/lib/db/queries-extended";
import { getKacakNotlari } from "@/lib/actions/kacak-notes";
import { KacakNotesSection } from "@/components/kacak/kacak-notes-section";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/auth/permissions";
import { FileCheck, Calculator, Activity, Scale } from "lucide-react";

const ispatIcon = {
  olcum: Activity,
  hesap: Calculator,
  profil: Activity,
  karsilastirma: Scale,
};

export async function KacakDetailPanel({
  kacak,
  abone,
  trafoKod,
  fiderKod,
  ispatlar,
  year,
  month,
}: {
  kacak: KacakTespiti;
  abone: Abone;
  trafoKod: string | null;
  fiderKod: string | null;
  ispatlar: IspatKaydi[];
  year: number;
  month: number;
}) {
  const hourly = await getAboneHourly(abone.id, year, month);
  const notes = await getKacakNotlari(kacak.id);
  const session = await auth();
  const canEdit = hasPermission(session?.user?.role, "veri_duzenleme");

  return (
    <div className="space-y-4">
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="danger" className="mb-2">
                {kacak.durum === "kritik" ? "Kritik tespit" : "Uyarı"}
              </Badge>
              <CardTitle className="text-xl text-red-900">
                {KACAK_TIPI_LABELS[kacak.kacakTipi]}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-700">
                {abone.ad} {abone.soyad} · {abone.aboneNo}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-slate-800">
                Güven skoru: %{kacak.guvenSkoru.toFixed(0)}
              </p>
              <p className="text-red-700">
                Tahmini kayıp: {kacak.tahminiKayipKwh?.toFixed(1)} kWh
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Anlatım</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {kacak.anlatim}
            </p>
          </div>
          {kacak.muhendisYorumu && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <FileCheck className="h-4 w-4" />
                Mühendis yorumu
              </h4>
              <p className="mt-2 text-sm text-amber-800">
                {kacak.muhendisYorumu}
              </p>
            </div>
          )}
          <p className="text-xs text-slate-700">
            {trafoKod} / {fiderKod} · Dönem {kacak.donem}
          </p>
          <Link href={`/dashboard/aboneler/${abone.id}`}>
            <Button variant="outline" size="sm">
              Abone kartına git
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İspatlar ve Ölçüm Verileri</CardTitle>
          <p className="text-sm text-slate-700">
            Tespitin dayandığı sayaç, hesap ve profil kanıtları
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {ispatlar.map((isp, i) => {
              const Icon = ispatIcon[isp.tip] ?? Activity;
              return (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-700">
                      {isp.tip}
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {isp.baslik}
                    </p>
                    <p className="text-sm text-slate-700">
                      {isp.deger}
                      {isp.birim ? ` ${isp.birim}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <KacakNotesSection
        kacakTespitId={kacak.id}
        notes={notes}
        canEdit={canEdit}
      />

      <Card>
        <CardHeader>
          <CardTitle>Saatlik Tüketim Profili (Tespit Günü)</CardTitle>
          <p className="text-sm text-slate-700">
            Anormal yük desenlerinin saat bazında görünümü
          </p>
        </CardHeader>
        <CardContent>
          <KacakHourlyChart data={hourly} highlightNight />
        </CardContent>
      </Card>
    </div>
  );
}
