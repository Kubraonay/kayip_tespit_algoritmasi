"use client";

import { useState } from "react";
import { saveBildirimAyarlari } from "@/lib/actions/alarmlar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NotificationSettingsForm({
  defaults,
}: {
  defaults: {
    emailAktif: boolean;
    smsAktif: boolean;
    pushAktif: boolean;
    telefon: string | null;
  };
}) {
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await saveBildirimAyarlari(new FormData(e.currentTarget));
    setMsg("error" in res && res.error ? res.error : "Ayarlar kaydedildi");
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          name="emailAktif"
          defaultChecked={defaults.emailAktif}
          className="h-4 w-4"
        />
        E-posta bildirimleri
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          name="smsAktif"
          defaultChecked={defaults.smsAktif}
          className="h-4 w-4"
        />
        SMS bildirimleri
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          name="pushAktif"
          defaultChecked={defaults.pushAktif}
          className="h-4 w-4"
        />
        Push bildirimleri (tarayıcı)
      </label>
      <div className="space-y-2">
        <Label htmlFor="telefon">SMS telefon numarası</Label>
        <Input
          id="telefon"
          name="telefon"
          defaultValue={defaults.telefon ?? ""}
          placeholder="05xxxxxxxxx"
        />
      </div>
      <p className="text-xs text-slate-600">
        E-posta/SMS için ortam değişkenleri: NOTIFICATION_EMAIL_WEBHOOK,
        NOTIFICATION_SMS_WEBHOOK veya SMTP_HOST
      </p>
      <Button type="submit">Kaydet</Button>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </form>
  );
}
