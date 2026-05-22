import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { scanAlarms } from "@/lib/alarmlar/engine";

export async function POST() {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "alarm_yonetimi"))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const result = await scanAlarms();
  return NextResponse.json(result);
}
