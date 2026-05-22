"use client";

import { createSayac } from "@/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Abone } from "@/lib/db/schema";

export function SayacForm({ aboneler }: { aboneler: Abone[] }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createSayac(new FormData(e.currentTarget));
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Seri No</Label>
        <Input name="seriNo" required />
      </div>
      <div>
        <Label>Tip</Label>
        <select
          name="tip"
          className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="abone">Abone</option>
          <option value="bolgesel">Bölgesel</option>
          <option value="fider_giris">Fider Giriş</option>
        </select>
      </div>
      <div>
        <Label>Abone (opsiyonel)</Label>
        <select
          name="aboneId"
          className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="">—</option>
          {aboneler.map((a) => (
            <option key={a.id} value={a.id}>
              {a.aboneNo}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Marka</Label>
        <Input name="marka" />
      </div>
      <Button type="submit" className="w-full">
        Ekle
      </Button>
    </form>
  );
}
