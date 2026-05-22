"use client";

import { useState } from "react";
import { saveTutanak } from "@/lib/actions/saha";
import type { TutanakIcerik } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TutanakForm({
  gorevId,
  initial,
  defaults,
}: {
  gorevId: number;
  initial: TutanakIcerik | null;
  defaults: TutanakIcerik;
}) {
  const [form, setForm] = useState<TutanakIcerik>(initial ?? defaults);
  const [msg, setMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await saveTutanak(gorevId, form, form.imzaMetni);
    setMsg("error" in res && res.error ? res.error : "Tutanak kaydedildi");
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Tarih</Label>
          <Input
            value={form.tarih}
            onChange={(e) => setForm({ ...form, tarih: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Ekip</Label>
          <Input
            value={form.ekipAd}
            onChange={(e) => setForm({ ...form, ekipAd: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Saha bulgusu</Label>
        <textarea
          className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900"
          rows={3}
          value={form.sahaBulgusu}
          onChange={(e) => setForm({ ...form, sahaBulgusu: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Ölçüm notu</Label>
        <textarea
          className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900"
          rows={2}
          value={form.olcumNotu ?? ""}
          onChange={(e) => setForm({ ...form, olcumNotu: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>İmza / yetkili</Label>
        <Input
          value={form.imzaMetni ?? ""}
          onChange={(e) => setForm({ ...form, imzaMetni: e.target.value })}
        />
      </div>
      <Button type="submit" size="sm">
        Tutanak kaydet
      </Button>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </form>
  );
}
