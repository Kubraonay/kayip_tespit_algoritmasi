import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getDb } from "@/lib/db";
import { sahaGorevleri } from "@/lib/db/schema";
import { kaydetKonum } from "@/lib/actions/saha";

export async function GET() {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "saha_yonetimi"))) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const db = getDb();
  const gorevler = await db
    .select()
    .from(sahaGorevleri)
    .where(
      inArray(sahaGorevleri.durum, ["yola_cikildi", "sahada", "inceleme"])
    );

  let count = 0;
  for (const g of gorevler) {
    if (!g.atananPersonelId || g.hedefEnlem == null || g.hedefBoylam == null) {
      continue;
    }
    const jitter = () => (Math.random() - 0.5) * 0.008;
    await kaydetKonum({
      personelId: g.atananPersonelId,
      gorevId: g.id,
      enlem: g.hedefEnlem + jitter(),
      boylam: g.hedefBoylam + jitter(),
      kaynak: "simulasyon",
    });
    count++;
  }

  return NextResponse.json({ success: true, updated: count });
}
