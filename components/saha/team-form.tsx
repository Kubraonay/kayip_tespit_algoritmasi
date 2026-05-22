"use client";

import { useState } from "react";
import { createSahaEkip } from "@/lib/actions/saha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TrafoMerkezi } from "@/lib/db/schema";

export function TeamForm({ trafolar }: { trafolar: TrafoMerkezi[] }) {
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const res = await createSahaEkip(new FormData(e.currentTarget));
    if ("error" in res && res.error) setMsg(res.error);
    else {
      setMsg("Ekip oluşturuldu");
      e.currentTarget.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="kod">Ekip Kodu</Label>
        <Input id="kod" name="kod" required placeholder="EKP-03" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ad">Ekip Adı</Label>
        <Input id="ad" name="ad" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bolge">Bölge</Label>
        <Input id="bolge" name="bolge" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trafoId">Trafo (opsiyonel)</Label>
        <select
          id="trafoId"
          name="trafoId"
          className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
        >
          <option value="">—</option>
          {trafolar.map((t) => (
            <option key={t.id} value={t.id}>
              {t.kod} — {t.ad}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit">Ekip Ekle</Button>
        {msg && <span className="text-sm text-slate-700">{msg}</span>}
      </div>
    </form>
  );
}
