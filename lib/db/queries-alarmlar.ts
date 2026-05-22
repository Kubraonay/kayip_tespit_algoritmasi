import { eq, desc, and, sql, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { alarmlar, alarmBildirimLoglari, kullaniciBildirimAyarlari } from "@/lib/db/schema";
import type { AlarmSeviye } from "@/lib/db/schema";

export async function getAlarmKpi() {
  const db = getDb();
  const rows = await db
    .select({
      seviye: alarmlar.seviye,
      count: sql<number>`count(*)`,
    })
    .from(alarmlar)
    .where(eq(alarmlar.durum, "aktif"))
    .groupBy(alarmlar.seviye);

  const map: Record<string, number> = { kritik: 0, orta: 0, dusuk: 0 };
  for (const r of rows) map[r.seviye] = r.count;

  const okunmamis = await db
    .select({ count: sql<number>`count(*)` })
    .from(alarmlar)
    .where(and(eq(alarmlar.okundu, false), eq(alarmlar.durum, "aktif")));

  return {
    kritik: map.kritik ?? 0,
    orta: map.orta ?? 0,
    dusuk: map.dusuk ?? 0,
    okunmamis: okunmamis[0]?.count ?? 0,
  };
}

export async function getAlarmlar(filters?: {
  seviye?: AlarmSeviye;
  durum?: "aktif" | "cozuldu" | "okundu";
  okundu?: boolean;
  limit?: number;
  since?: Date;
}) {
  const db = getDb();
  const conditions = [];
  if (filters?.seviye) conditions.push(eq(alarmlar.seviye, filters.seviye));
  if (filters?.durum) conditions.push(eq(alarmlar.durum, filters.durum));
  if (filters?.okundu !== undefined)
    conditions.push(eq(alarmlar.okundu, filters.okundu));
  if (filters?.since) conditions.push(gte(alarmlar.createdAt, filters.since));

  const q = db.select().from(alarmlar).orderBy(desc(alarmlar.createdAt));
  if (conditions.length > 0) {
    return q.where(and(...conditions)).limit(filters?.limit ?? 200);
  }
  return q.limit(filters?.limit ?? 200);
}

export async function getAlarmById(id: number) {
  const db = getDb();
  const rows = await db.select().from(alarmlar).where(eq(alarmlar.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getLiveAlarms(sinceIso: string) {
  const since = new Date(sinceIso);
  return getAlarmlar({ since, limit: 50 });
}

export async function getAlarmGecmisi(page = 1, pageSize = 20) {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  const data = await db
    .select()
    .from(alarmlar)
    .orderBy(desc(alarmlar.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = await db.select({ count: sql<number>`count(*)` }).from(alarmlar);

  return { data, total: total[0]?.count ?? 0 };
}

export async function getBildirimLoglari(alarmId?: number, limit = 50) {
  const db = getDb();
  const q = db
    .select()
    .from(alarmBildirimLoglari)
    .orderBy(desc(alarmBildirimLoglari.createdAt))
    .limit(limit);
  if (alarmId) {
    return q.where(eq(alarmBildirimLoglari.alarmId, alarmId));
  }
  return q;
}

export async function getBildirimAyarlari(kullaniciId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(kullaniciBildirimAyarlari)
    .where(eq(kullaniciBildirimAyarlari.kullaniciId, kullaniciId))
    .limit(1);
  return rows[0] ?? null;
}
