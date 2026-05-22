import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getSonKonumlar, getAktifGorevlerHarita } from "@/lib/db/queries-saha";

export async function GET() {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "saha_goruntuleme"))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const [konumlar, gorevler] = await Promise.all([
    getSonKonumlar(),
    getAktifGorevlerHarita(),
  ]);

  return NextResponse.json({ konumlar, gorevler });
}
