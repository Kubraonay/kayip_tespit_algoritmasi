"use client";

import { useMemo, useState } from "react";
import { createGorevFromKacak } from "@/lib/actions/saha";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export function CreateGorevButton({
  kacakTespitId,
  ekipler,
  personeller,
  existingGorevId,
}: {
  kacakTespitId: number;
  ekipler: { id: number; kod: string; ad: string }[];
  personeller: { id: number; adSoyad: string; ekipId: number | null }[];
  existingGorevId?: number | null;
}) {
  const [ekipId, setEkipId] = useState(ekipler[0]?.id?.toString() ?? "");
  const [personelId, setPersonelId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredPersonel = useMemo(
    () => personeller.filter((p) => p.ekipId === Number(ekipId)),
    [personeller, ekipId]
  );

  if (existingGorevId) {
    return (
      <a
        href={`/dashboard/saha-operasyonlari/gorevler/${existingGorevId}`}
        className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        Saha görevi #{existingGorevId}
      </a>
    );
  }

  async function handleCreate() {
    if (!ekipId) return;
    setLoading(true);
    setMsg("");
    const res = await createGorevFromKacak(
      kacakTespitId,
      Number(ekipId),
      personelId ? Number(personelId) : undefined
    );
    setLoading(false);
    if ("error" in res && res.error) setMsg(res.error);
    else if ("gorevId" in res && res.gorevId) {
      window.location.href = `/dashboard/saha-operasyonlari/gorevler/${res.gorevId}`;
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-orange-200 bg-orange-50/50 p-3">
      <ClipboardList className="h-5 w-5 text-orange-600" />
      <select
        value={ekipId}
        onChange={(e) => {
          setEkipId(e.target.value);
          setPersonelId("");
        }}
        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900"
      >
        {ekipler.map((e) => (
          <option key={e.id} value={e.id}>
            {e.kod}
          </option>
        ))}
      </select>
      {filteredPersonel.length > 0 && (
        <select
          value={personelId}
          onChange={(e) => setPersonelId(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900"
        >
          <option value="">Personel (ops.)</option>
          {filteredPersonel.map((p) => (
            <option key={p.id} value={p.id}>
              {p.adSoyad}
            </option>
          ))}
        </select>
      )}
      <Button type="button" size="sm" onClick={handleCreate} disabled={loading}>
        {loading ? "..." : "Saha görevi oluştur"}
      </Button>
      {msg && <span className="text-xs text-red-600">{msg}</span>}
    </div>
  );
}
