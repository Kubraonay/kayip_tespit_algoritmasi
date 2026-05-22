import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { LiveAlarmFeed } from "@/components/alarmlar/live-alarm-feed";
import { Radio } from "lucide-react";

export default async function CanliBildirimlerPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "alarm_goruntuleme"))) {
    redirect("/dashboard/yetkisiz?from=/dashboard/bildirimler/canli");
  }
  const canManage = await hasPermission(session?.user?.role, "alarm_yonetimi");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
          <Radio className="h-6 w-6 animate-pulse text-emerald-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Canlı Bildirimler</h2>
          <p className="text-slate-700">
            Yeni alarmlar anlık toast ve push ile gelir — 10 sn yenileme
          </p>
        </div>
      </div>
      <LiveAlarmFeed canManage={canManage} />
    </div>
  );
}
