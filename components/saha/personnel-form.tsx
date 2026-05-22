"use client";

import { useState } from "react";
import { createSahaPersonel } from "@/lib/actions/saha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PersonnelForm({
  ekipler,
}: {
  ekipler: { id: number; kod: string; ad: string }[];
}) {
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const res = await createSahaPersonel(new FormData(e.currentTarget));
    if ("error" in res && res.error) setMsg(res.error);
    else {
      setMsg("Personel eklendi");
      e.currentTarget.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="sicilNo">Sicil No</Label>
        <Input id="sicilNo" name="sicilNo" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adSoyad">Ad Soyad</Label>
        <Input id="adSoyad" name="adSoyad" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefon">Telefon</Label>
        <Input id="telefon" name="telefon" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ekipId">Ekip</Label>
        <select
          id="ekipId"
          name="ekipId"
          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
        >
          <option value="">—</option>
          {ekipler.map((e) => (
            <option key={e.id} value={e.id}>
              {e.kod} — {e.ad}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="unvan">Ünvan</Label>
        <select
          id="unvan"
          name="unvan"
          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
          defaultValue="saha_teknisyeni"
        >
          <option value="ekip_lideri">Ekip Lideri</option>
          <option value="saha_teknisyeni">Saha Teknisyeni</option>
        </select>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit">Personel Ekle</Button>
        {msg && <span className="text-sm text-slate-700">{msg}</span>}
      </div>
    </form>
  );
}
