"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getDb } from "@/lib/db";
import { alarmlar, kullaniciBildirimAyarlari } from "@/lib/db/schema";
import { scanAlarms } from "@/lib/alarmlar/engine";
import { kayitIslemLog } from "@/lib/audit/log";

async function requireAlarmView() {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "alarm_goruntuleme"))) {
    return { error: "Yetkisiz" as const };
  }
  return { session };
}

export async function runAlarmScan() {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "alarm_yonetimi"))) {
    return { error: "Yetkisiz" };
  }
  const result = await scanAlarms();
  revalidatePath("/dashboard/alarm-merkezi");
  return { success: true, ...result };
}

export async function markAlarmRead(alarmId: number) {
  const authResult = await requireAlarmView();
  if ("error" in authResult) return authResult;

  const db = getDb();
  await db
    .update(alarmlar)
    .set({ okundu: true })
    .where(eq(alarmlar.id, alarmId));

  revalidatePath("/dashboard/alarm-merkezi");
  return { success: true };
}

export async function markAlarmResolved(alarmId: number) {
  const session = await auth();
  if (!session?.user || !(await hasPermission(session.user.role, "alarm_yonetimi"))) {
    return { error: "Yetkisiz" };
  }

  const db = getDb();
  await db
    .update(alarmlar)
    .set({ durum: "cozuldu", cozulmeAt: new Date(), okundu: true })
    .where(eq(alarmlar.id, alarmId));

  await kayitIslemLog({
    kullaniciId: Number(session.user.id),
    kullaniciAd: session.user.name,
    islemTipi: "alarm_cozuldu",
    varlikTipi: "alarm",
    varlikId: alarmId,
    aciklama: `Alarm #${alarmId} çözüldü`,
  });

  revalidatePath("/dashboard/alarm-merkezi");
  revalidatePath("/dashboard/bildirimler/gecmis");
  return { success: true };
}

export async function markAllAlarmsRead() {
  const authResult = await requireAlarmView();
  if ("error" in authResult) return authResult;

  const db = getDb();
  await db.update(alarmlar).set({ okundu: true }).where(eq(alarmlar.okundu, false));

  revalidatePath("/dashboard/alarm-merkezi");
  return { success: true };
}

export async function saveBildirimAyarlari(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Oturum gerekli" };

  const kullaniciId = Number(session.user.id);
  const emailAktif = formData.get("emailAktif") === "on";
  const smsAktif = formData.get("smsAktif") === "on";
  const pushAktif = formData.get("pushAktif") === "on";
  const telefon = String(formData.get("telefon") ?? "") || null;
  const pushEndpoint = String(formData.get("pushEndpoint") ?? "") || null;

  const db = getDb();
  const existing = await db
    .select()
    .from(kullaniciBildirimAyarlari)
    .where(eq(kullaniciBildirimAyarlari.kullaniciId, kullaniciId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(kullaniciBildirimAyarlari)
      .set({ emailAktif, smsAktif, pushAktif, telefon, pushEndpoint })
      .where(eq(kullaniciBildirimAyarlari.kullaniciId, kullaniciId));
  } else {
    await db.insert(kullaniciBildirimAyarlari).values({
      kullaniciId,
      emailAktif,
      smsAktif,
      pushAktif,
      telefon,
      pushEndpoint,
      createdAt: new Date(),
    });
  }

  revalidatePath("/dashboard/bildirimler/ayarlar");
  return { success: true };
}
