"use client";

import { useState } from "react";
import { createAbone } from "@/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TrafoMerkezi, Fider } from "@/lib/db/schema";

export function AboneForm({
  trafolar,
  fiderler,
}: {
  trafolar: TrafoMerkezi[];
  fiderler: Fider[];
}) {
  const [trafoId, setTrafoId] = useState("");
  const filteredFiderler = fiderler.filter(
    (f) => !trafoId || f.trafoId === Number(trafoId)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createAbone(fd);
    e.currentTarget.reset();
    setTrafoId("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Abone No</Label>
        <Input name="aboneNo" required />
      </div>
      <div>
        <Label>Ad</Label>
        <Input name="ad" required />
      </div>
      <div>
        <Label>Soyad</Label>
        <Input name="soyad" required />
      </div>
      <div>
        <Label>Adres</Label>
        <Input name="adres" />
      </div>
      <div>
        <Label>Trafo</Label>
        <select
          name="trafoId"
          className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          value={trafoId}
          onChange={(e) => setTrafoId(e.target.value)}
          required
        >
          <option value="">Seçin</option>
          {trafolar.map((t) => (
            <option key={t.id} value={t.id}>
              {t.kod} — {t.ad}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Fider</Label>
        <select
          name="fiderId"
          className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          required
        >
          <option value="">Seçin</option>
          {filteredFiderler.map((f) => (
            <option key={f.id} value={f.id}>
              {f.kod} — {f.ad}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Tarife</Label>
        <select
          name="tarifeGrubu"
          className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
        >
          <option value="mesken">Mesken</option>
          <option value="sanayi">Sanayi</option>
          <option value="ticarethane">Ticarethane</option>
          <option value="tarimsal">Tarımsal Sulama</option>
        </select>
      </div>
      <Button type="submit" className="w-full">
        Kaydet
      </Button>
    </form>
  );
}
