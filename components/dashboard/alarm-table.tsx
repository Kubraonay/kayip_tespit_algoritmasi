import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { KayipAnalizi } from "@/lib/db/schema";

const durumVariant = {
  normal: "success" as const,
  uyari: "warning" as const,
  kritik: "danger" as const,
};

const seviyeLabel = {
  abone: "Abone",
  fider: "Fider",
  trafo: "Trafo",
  sistem: "Sistem",
};

export function AlarmTable({ alarms }: { alarms: KayipAnalizi[] }) {
  if (alarms.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-700">
        Bu dönem için alarm yok. Analiz çalıştırın.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-700">
            <th className="pb-3 pr-4 font-medium">Dönem</th>
            <th className="pb-3 pr-4 font-medium">Seviye</th>
            <th className="pb-3 pr-4 font-medium">Oran</th>
            <th className="pb-3 pr-4 font-medium">Durum</th>
            <th className="pb-3 font-medium">Açıklama</th>
          </tr>
        </thead>
        <tbody>
          {alarms.map((a) => (
            <tr key={a.id} className="border-b border-slate-100">
              <td className="py-3 pr-4">{a.donem}</td>
              <td className="py-3 pr-4">{seviyeLabel[a.seviye]}</td>
              <td className="py-3 pr-4 font-medium">
                %{(a.oranYuzde ?? 0).toFixed(1)}
              </td>
              <td className="py-3 pr-4">
                <Badge variant={durumVariant[a.durum]}>{a.durum}</Badge>
              </td>
              <td className="py-3 text-slate-700">
                {a.seviye === "abone" && a.referansId ? (
                  <Link
                    href={`/dashboard/kacak-tespit`}
                    className="text-red-600 hover:underline"
                  >
                    {a.aciklama}
                  </Link>
                ) : (
                  a.aciklama
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
