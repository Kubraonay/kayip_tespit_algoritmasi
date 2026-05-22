import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getAlarmGecmisi } from "@/lib/db/queries-alarmlar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  ALARM_TIPI_LABELS,
  ALARM_SEVIYE_LABELS,
} from "@/lib/db/schema";
import { paginate } from "@/lib/utils";

const PAGE_SIZE = 15;

export default async function AlarmGecmisiPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "alarm_goruntuleme"))) {
    redirect("/dashboard/yetkisiz?from=/dashboard/bildirimler/gecmis");
  }
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const { data: all } = await getAlarmGecmisi(1, 500);
  const { data, totalPages, total: t, page: safePage } = paginate(
    all,
    page,
    PAGE_SIZE
  );

  const seviyeVariant = {
    kritik: "danger" as const,
    orta: "warning" as const,
    dusuk: "default" as const,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Alarm Geçmişi</h2>
        <p className="text-slate-700">
          Tüm sistem alarmları ve bildirim kanalı kayıtları — {t} kayıt
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alarm listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-700">
                  <th className="py-2 pr-4">Tarih</th>
                  <th className="pr-4">Seviye</th>
                  <th className="pr-4">Tip</th>
                  <th className="pr-4">Başlık</th>
                  <th className="pr-4">Abone</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
                      {new Date(a.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="pr-4">
                      <Badge variant={seviyeVariant[a.seviye as keyof typeof seviyeVariant] ?? "default"}>
                        {ALARM_SEVIYE_LABELS[a.seviye as keyof typeof ALARM_SEVIYE_LABELS]}
                      </Badge>
                    </td>
                    <td className="pr-4 text-slate-800">
                      {ALARM_TIPI_LABELS[a.tip as keyof typeof ALARM_TIPI_LABELS] ?? a.tip}
                    </td>
                    <td className="pr-4 max-w-xs">
                      <Link
                        href={`/dashboard/alarm-merkezi`}
                        className="font-medium text-sky-600 hover:underline"
                      >
                        {a.baslik}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                        {a.aciklama}
                      </p>
                    </td>
                    <td className="pr-4 text-slate-700">{a.aboneNo ?? "—"}</td>
                    <td>
                      <span className="text-xs text-slate-600">
                        {a.durum}
                        {a.okundu ? " · okundu" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={t}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
  );
}
