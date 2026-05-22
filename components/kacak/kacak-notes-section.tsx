"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addKacakNotu } from "@/lib/actions/kacak-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ROL_LABELS, type UserRole } from "@/lib/auth/permissions";
import { StickyNote, User } from "lucide-react";

type NoteRow = {
  not: {
    id: number;
    icerik: string;
    createdAt: Date | null;
  };
  kullaniciAd: string;
  kullaniciEmail: string;
  kullaniciRol: string;
};

export function KacakNotesSection({
  kacakTespitId,
  notes,
  canEdit,
}: {
  kacakTespitId: number;
  notes: NoteRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("kacakTespitId", String(kacakTespitId));
    const res = await addKacakNotu(fd);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <Card className="border-violet-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-900">
          <StickyNote className="h-5 w-5" />
          Özel Notlar ({notes.length})
        </CardTitle>
        <p className="text-sm text-slate-700">
          Saha inceleme, tutanak ve mühendislik notları — kim ne zaman ekledi
          kayıt altında
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-violet-100 bg-violet-50/50 p-4">
            <div>
              <Label htmlFor="icerik">Yeni not</Label>
              <textarea
                id="icerik"
                name="icerik"
                required
                rows={4}
                placeholder="Örn: 15.12.2025 saha kontrolü — sayaç mührü intact, harici hat şüphesi devam ediyor..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} size="sm">
              {loading ? "Kaydediliyor..." : "Notu Kaydet"}
            </Button>
          </form>
        )}

        {notes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-700">
            Henüz not eklenmemiş
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map(({ not, kullaniciAd, kullaniciEmail, kullaniciRol }) => (
              <li
                key={not.id}
                className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-4 w-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {kullaniciAd}
                      </p>
                      <p className="text-xs text-slate-700">{kullaniciEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="text-[10px]">
                      {kullaniciRol in ROL_LABELS
                        ? ROL_LABELS[kullaniciRol as UserRole]
                        : kullaniciRol}
                    </Badge>
                    <p className="mt-1 text-xs text-slate-700">
                      {not.createdAt
                        ? new Date(not.createdAt).toLocaleString("tr-TR")
                        : "—"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {not.icerik}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
