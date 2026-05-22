"use server";

import { getDb } from "@/lib/db";
import { islemLoglari } from "@/lib/db/schema";

export type LogParams = {
  kullaniciId?: number | null;
  kullaniciAd?: string | null;
  islemTipi: string;
  varlikTipi?: string | null;
  varlikId?: number | null;
  aciklama: string;
  detay?: string | null;
};

export async function kayitIslemLog(params: LogParams) {
  const db = getDb();
  await db.insert(islemLoglari).values({
    kullaniciId: params.kullaniciId ?? null,
    kullaniciAd: params.kullaniciAd ?? null,
    islemTipi: params.islemTipi,
    varlikTipi: params.varlikTipi ?? null,
    varlikId: params.varlikId ?? null,
    aciklama: params.aciklama,
    detay: params.detay ?? null,
  });
}
