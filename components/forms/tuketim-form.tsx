"use client";

import { createTuketim } from "@/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Sayac } from "@/lib/db/schema";

export function TuketimForm({ sayaclar }: { sayaclar: Sayac[] }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createTuketim(new FormData(e.currentTarget));
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Sayaç</Label>
        <select
          name="sayacId"
          className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          required
        >
          <option value="">Seçin</option>
          {sayaclar.map((s) => (
            <option key={s.id} value={s.id}>
              {s.seriNo} ({s.tip})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Yıl</Label>
          <Input name="yil" type="number" defaultValue={2025} required />
        </div>
        <div>
          <Label>Ay</Label>
          <Input name="ay" type="number" min={1} max={12} defaultValue={12} required />
        </div>
      </div>
      <div>
        <Label>Aktif Tüketim (kWh)</Label>
        <Input name="aktifKwh" type="number" step="0.01" required />
      </div>
      <Button type="submit" className="w-full">
        Kaydet
      </Button>
    </form>
  );
}
