import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getMapAboneler } from "@/lib/db/queries-extended";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const donem = sp.get("donem") ?? "2025-12";
  const data = await getMapAboneler(donem, {
    trafoId: sp.get("trafoId") ? Number(sp.get("trafoId")) : undefined,
    fiderId: sp.get("fiderId") ? Number(sp.get("fiderId")) : undefined,
    tarife: sp.get("tarife") || undefined,
    sadeceKacak: sp.get("sadeceKacak") === "1",
    durum: sp.get("durum") || undefined,
  });
  return NextResponse.json(data);
}
