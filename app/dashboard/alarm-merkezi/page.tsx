import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getAlarmKpi, getAlarmlar } from "@/lib/db/queries-alarmlar";
import { AlarmCard } from "@/components/alarmlar/alarm-card";
import { ScanAlarmsButton } from "@/components/alarmlar/scan-alarms-button";
import { markAllAlarmsRead } from "@/lib/actions/alarmlar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BellRing, History, Settings } from "lucide-react";

export default async function AlarmMerkeziPage({
  searchParams,
}: {
  searchParams: Promise<{ seviye?: string }>;
}) {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "alarm_goruntuleme"))) {
    redirect("/dashboard/yetkisiz?from=/dashboard/alarm-merkezi");
  }
  const canManage = await hasPermission(session?.user?.role, "alarm_yonetimi");
  const sp = await searchParams;
  const kpi = await getAlarmKpi();
  const seviye = sp.seviye as "kritik" | "orta" | "dusuk" | undefined;
  const alarms = await getAlarmlar({
    seviye,
    durum: "aktif",
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BellRing className="h-7 w-7 text-orange-400" />
              <h2 className="text-2xl font-bold">Alarm Merkezi</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Ani tüketim, enerjisiz sayaç, mühür, ters bağlantı, faz kaybı ve offline
              olayları gerçek zamanlı izlenir. SMS, e-posta ve push kanalları kayıt altına alınır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/bildirimler/gecmis"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700"
            >
              <History className="h-4 w-4" />
              Geçmiş
            </Link>
            <Link
              href="/dashboard/bildirimler/ayarlar"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
              Ayarlar
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-red-600/30 px-4 py-3">
            <p className="text-xs uppercase text-red-200">Kritik</p>
            <p className="text-2xl font-bold">{kpi.kritik}</p>
          </div>
          <div className="rounded-xl bg-amber-500/30 px-4 py-3">
            <p className="text-xs uppercase text-amber-100">Orta</p>
            <p className="text-2xl font-bold">{kpi.orta}</p>
          </div>
          <div className="rounded-xl bg-sky-600/30 px-4 py-3">
            <p className="text-xs uppercase text-sky-100">Düşük</p>
            <p className="text-2xl font-bold">{kpi.dusuk}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase text-slate-400">Okunmamış</p>
            <p className="text-2xl font-bold">{kpi.okunmamis}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["kritik", "orta", "dusuk"] as const).map((s) => (
            <Link
              key={s}
              href={`/dashboard/alarm-merkezi?seviye=${s}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize",
                sp.seviye === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              )}
            >
              {s}
            </Link>
          ))}
          <Link
            href="/dashboard/alarm-merkezi"
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              !sp.seviye ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            )}
          >
            Tümü
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && <ScanAlarmsButton />}
          <form
            action={async () => {
              "use server";
              await markAllAlarmsRead();
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Tümünü okundu işaretle
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {alarms.length === 0 ? (
          <p className="col-span-2 rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-700">
            Bu filtrede aktif alarm yok. Alarm taraması çalıştırın.
          </p>
        ) : (
          alarms.map((a) => (
            <AlarmCard key={a.id} alarm={a} canManage={canManage} />
          ))
        )}
      </div>
    </div>
  );
}
