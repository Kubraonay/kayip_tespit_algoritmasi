"use client";

import { useState } from "react";
import { updateGorevDurum } from "@/lib/actions/saha";
import { SAHA_GOREV_DURUMLARI, SAHA_GOREV_DURUM_LABELS } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

export function GorevDurumSelect({
  gorevId,
  current,
}: {
  gorevId: number;
  current: string;
}) {
  const [durum, setDurum] = useState(current);
  const [not, setNot] = useState("");
  const [loading, setLoading] = useState(false);

  async function apply() {
    setLoading(true);
    await updateGorevDurum(gorevId, durum, not || undefined);
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <select
        value={durum}
        onChange={(e) => setDurum(e.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
      >
        {SAHA_GOREV_DURUMLARI.map((d) => (
          <option key={d} value={d}>
            {SAHA_GOREV_DURUM_LABELS[d]}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Not (opsiyonel)"
        value={not}
        onChange={(e) => setNot(e.target.value)}
        className="h-10 min-w-[160px] flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
      />
      <Button type="button" size="sm" onClick={apply} disabled={loading}>
        Durumu güncelle
      </Button>
    </div>
  );
}
