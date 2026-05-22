"use client";

import { createTrafo, createFider } from "@/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrafoMerkezi } from "@/lib/db/schema";

export function SebekeForms({ trafolar }: { trafolar: TrafoMerkezi[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Trafo Merkezi</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createTrafo(new FormData(e.currentTarget));
              e.currentTarget.reset();
            }}
            className="space-y-3"
          >
            <div>
              <Label>Kod</Label>
              <Input name="kod" placeholder="TM-XXX-01" required />
            </div>
            <div>
              <Label>Ad</Label>
              <Input name="ad" required />
            </div>
            <div>
              <Label>İlçe</Label>
              <Input name="ilce" />
            </div>
            <div>
              <Label>Kapasite (kVA)</Label>
              <Input name="kapasiteKva" type="number" defaultValue={400} />
            </div>
            <Button type="submit" className="w-full">
              Trafo Ekle
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Fider</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createFider(new FormData(e.currentTarget));
              e.currentTarget.reset();
            }}
            className="space-y-3"
          >
            <div>
              <Label>Trafo</Label>
              <select
                name="trafoId"
                className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                required
              >
                {trafolar.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.kod}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Kod</Label>
              <Input name="kod" placeholder="F1" required />
            </div>
            <div>
              <Label>Ad</Label>
              <Input name="ad" required />
            </div>
            <div>
              <Label>Hat Uzunluğu (m)</Label>
              <Input name="hatUzunlukM" type="number" defaultValue={500} />
            </div>
            <div>
              <Label>Kesit (mm²)</Label>
              <Input name="kesitMm2" type="number" defaultValue={95} />
            </div>
            <Button type="submit" className="w-full">
              Fider Ekle
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
