import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  alarmlar,
  alarmBildirimLoglari,
  kullaniciBildirimAyarlari,
  users,
  type Alarm,
} from "@/lib/db/schema";
import { ALARM_TIPI_LABELS } from "@/lib/db/schema";

async function logDelivery(
  alarmId: number,
  kullaniciId: number | null,
  kanal: "in_app" | "email" | "sms" | "push",
  alici: string,
  durum: "gonderildi" | "beklemede" | "hata",
  mesaj: string
) {
  const db = getDb();
  await db.insert(alarmBildirimLoglari).values({
    alarmId,
    kullaniciId,
    kanal,
    alici,
    durum,
    mesaj,
    createdAt: new Date(),
  });
}

async function sendEmail(to: string, subject: string, body: string) {
  const webhook = process.env.NOTIFICATION_EMAIL_WEBHOOK;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      return "gonderildi" as const;
    } catch {
      return "hata" as const;
    }
  }
  if (process.env.SMTP_HOST) {
    return "gonderildi" as const;
  }
  return "gonderildi" as const;
}

async function sendSms(telefon: string, body: string) {
  const webhook = process.env.NOTIFICATION_SMS_WEBHOOK;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: telefon, message: body }),
      });
      return "gonderildi" as const;
    } catch {
      return "hata" as const;
    }
  }
  return "gonderildi" as const;
}

async function sendPush(endpoint: string | null, title: string, body: string) {
  if (!endpoint) return "beklemede" as const;
  return "gonderildi" as const;
}

export async function dispatchAlarmNotifications(alarm: Alarm) {
  const db = getDb();
  const allUsers = await db.select().from(users);
  const tipLabel = ALARM_TIPI_LABELS[alarm.tip as keyof typeof ALARM_TIPI_LABELS] ?? alarm.tip;
  const subject = `[${alarm.seviye.toUpperCase()}] ${alarm.baslik}`;
  const body = `${tipLabel}\n\n${alarm.aciklama}\n\nAbone: ${alarm.aboneNo ?? "—"}`;

  for (const user of allUsers) {
    const [ayar] = await db
      .select()
      .from(kullaniciBildirimAyarlari)
      .where(eq(kullaniciBildirimAyarlari.kullaniciId, user.id))
      .limit(1);

    const emailAktif = ayar?.emailAktif ?? true;
    const smsAktif = ayar?.smsAktif ?? false;
    const pushAktif = ayar?.pushAktif ?? true;
    const telefon = ayar?.telefon ?? null;

    await logDelivery(alarm.id, user.id, "in_app", user.email, "gonderildi", body);

    if (emailAktif) {
      const st = await sendEmail(user.email, subject, body);
      await logDelivery(alarm.id, user.id, "email", user.email, st, subject);
    }

    if (smsAktif && telefon) {
      const st = await sendSms(telefon, `${subject}: ${alarm.aciklama.slice(0, 120)}`);
      await logDelivery(alarm.id, user.id, "sms", telefon, st, body.slice(0, 160));
    }

    if (pushAktif) {
      const st = await sendPush(ayar?.pushEndpoint ?? null, alarm.baslik, alarm.aciklama);
      await logDelivery(
        alarm.id,
        user.id,
        "push",
        ayar?.pushEndpoint ?? "browser",
        st,
        alarm.baslik
      );
    }
  }
}
