import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getLiveAlarms, getAlarmKpi } from "@/lib/db/queries-alarmlar";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "alarm_goruntuleme"))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? new Date(Date.now() - 60000).toISOString();

  const [alarms, kpi] = await Promise.all([
    getLiveAlarms(since),
    getAlarmKpi(),
  ]);

  return NextResponse.json({
    alarms: alarms.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      cozulmeAt: a.cozulmeAt?.toISOString() ?? null,
    })),
    kpi,
    serverTime: new Date().toISOString(),
  });
}
