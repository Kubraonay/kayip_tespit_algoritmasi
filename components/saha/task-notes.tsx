"use client";

import { useState } from "react";
import { addGorevNotu } from "@/lib/actions/saha";
import { Button } from "@/components/ui/button";

export function TaskNotesSection({
  gorevId,
  notes,
  canEdit,
}: {
  gorevId: number;
  notes: {
    id: number;
    icerik: string;
    kaynak: string;
    kullaniciAd: string | null;
    createdAt: Date;
  }[];
  canEdit: boolean;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await addGorevNotu(gorevId, text.trim(), "merkez");
    setText("");
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-sm text-slate-700">Henüz not yok</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <p className="text-xs font-medium text-slate-600">
                {n.kaynak === "saha" ? "Saha" : "Merkez"}
                {n.kullaniciAd ? ` · ${n.kullaniciAd}` : ""} ·{" "}
                {new Date(n.createdAt).toLocaleString("tr-TR")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {n.icerik}
              </p>
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900"
            placeholder="Merkez notu..."
          />
          <Button type="submit" size="sm" disabled={loading}>
            Not ekle
          </Button>
        </form>
      )}
    </div>
  );
}
