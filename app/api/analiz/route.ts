import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { runFullAnalysis } from "@/lib/kayip-kacak/run-analysis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const body = await req.json();
  const year = Number(body.year) || new Date().getFullYear();
  const month = Number(body.month) || new Date().getMonth() + 1;
  const result = await runFullAnalysis(year, month);
  const { kayitIslemLog } = await import("@/lib/audit/log");
  await kayitIslemLog({
    kullaniciId: Number(session.user.id),
    kullaniciAd: session.user.name ?? session.user.email,
    islemTipi: "analiz_calistirildi",
    varlikTipi: "sistem",
    aciklama: `${session.user.name ?? "Kullanıcı"} ${year}-${String(month).padStart(2, "0")} dönemi için analiz çalıştırdı`,
    detay: JSON.stringify({
      donem: result.donem,
      analizSayisi: result.count,
      kacakSayisi: result.kacakCount,
    }),
  });
  return NextResponse.json(result);
}
