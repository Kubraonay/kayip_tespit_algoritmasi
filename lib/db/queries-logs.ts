import { desc, eq, and } from "drizzle-orm";
import { getDb } from "./index";
import { islemLoglari } from "./schema";

export async function getIslemLoglari(options: {
  page: number;
  pageSize: number;
  islemTipi?: string;
  kullaniciId?: number;
}) {
  const db = getDb();
  const conditions = [];
  if (options.islemTipi) {
    conditions.push(eq(islemLoglari.islemTipi, options.islemTipi));
  }
  if (options.kullaniciId) {
    conditions.push(eq(islemLoglari.kullaniciId, options.kullaniciId));
  }

  const all = await db
    .select()
    .from(islemLoglari)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(islemLoglari.createdAt));

  return all;
}
