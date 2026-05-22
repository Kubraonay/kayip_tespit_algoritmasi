import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import {
  kacakTespitleri,
  aboneler,
  trafoMerkezleri,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { KACAK_TIPI_LABELS } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      kacak: kacakTespitleri,
      abone: aboneler,
      trafoKod: trafoMerkezleri.kod,
    })
    .from(kacakTespitleri)
    .innerJoin(aboneler, eq(kacakTespitleri.aboneId, aboneler.id))
    .leftJoin(trafoMerkezleri, eq(aboneler.trafoId, trafoMerkezleri.id))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (rows[0]) {
    const { kacak, abone, trafoKod } = rows[0];
    return NextResponse.json({
      id: `kacak-${kacak.id}-${Date.now()}`,
      kacakId: kacak.id,
      aboneNo: abone.aboneNo,
      adSoyad: `${abone.ad} ${abone.soyad}`,
      tip: KACAK_TIPI_LABELS[kacak.kacakTipi],
      durum: kacak.durum,
      trafoKod,
      donem: kacak.donem,
      guvenSkoru: kacak.guvenSkoru,
      createdAt: new Date().toISOString(),
    });
  }

  const [abone] = await db
    .select()
    .from(aboneler)
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (!abone) {
    return NextResponse.json({ error: "Veri yok" }, { status: 404 });
  }

  const tips = Object.values(KACAK_TIPI_LABELS);
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return NextResponse.json({
    id: `sim-${Date.now()}`,
    kacakId: null,
    aboneNo: abone.aboneNo,
    adSoyad: `${abone.ad} ${abone.soyad}`,
    tip,
    durum: Math.random() > 0.5 ? "kritik" : "uyari",
    trafoKod: null,
    donem: "2025-12",
    guvenSkoru: 65 + Math.floor(Math.random() * 30),
    createdAt: new Date().toISOString(),
    simulated: true,
  });
}
