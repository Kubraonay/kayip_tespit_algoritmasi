import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { sahaGorevleri } from "@/lib/db/schema";
import { kaydetKonum } from "@/lib/actions/saha";
import { kayitIslemLog } from "@/lib/audit/log";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    personelId?: number;
    gorevId?: number;
    enlem: number;
    boylam: number;
    kaynak?: "gps" | "simulasyon";
  };

  if (
    typeof body.enlem !== "number" ||
    typeof body.boylam !== "number" ||
    Number.isNaN(body.enlem) ||
    Number.isNaN(body.boylam)
  ) {
    return NextResponse.json({ error: "Geçersiz koordinat" }, { status: 400 });
  }

  const kaynak = body.kaynak === "simulasyon" ? "simulasyon" : "gps";
  let personelId = body.personelId;
  let gorevId = body.gorevId;

  if (body.token) {
    const db = getDb();
    const [gorev] = await db
      .select()
      .from(sahaGorevleri)
      .where(eq(sahaGorevleri.paylasimToken, body.token))
      .limit(1);
    if (!gorev) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 404 });
    }
    gorevId = gorev.id;
    personelId = gorev.atananPersonelId ?? undefined;
    if (!personelId) {
      return NextResponse.json({ error: "Göreve personel atanmamış" }, { status: 400 });
    }
  } else {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (!personelId) {
      return NextResponse.json({ error: "personelId gerekli" }, { status: 400 });
    }
  }

  await kaydetKonum({
    personelId: personelId!,
    gorevId,
    enlem: body.enlem,
    boylam: body.boylam,
    kaynak,
  });

  if (!body.token) {
    const session = await auth();
    if (session?.user) {
      await kayitIslemLog({
        kullaniciId: Number(session.user.id),
        kullaniciAd: session.user.name,
        islemTipi: "saha_konum_guncellendi",
        varlikTipi: "saha_gorev",
        varlikId: gorevId ?? null,
        aciklama: `Konum güncellendi (${kaynak})`,
      });
    }
  }

  return NextResponse.json({ success: true });
}
