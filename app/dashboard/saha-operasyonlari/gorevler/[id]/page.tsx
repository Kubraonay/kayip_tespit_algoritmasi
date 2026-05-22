import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import {
  getSahaGorevById,
  getGorevDurumGecmisi,
  getGorevNotlari,
  getGorevFotograflari,
  getGorevTutanak,
} from "@/lib/db/queries-saha";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SAHA_GOREV_DURUM_LABELS,
  SAHA_ONCELIK_LABELS,
  KACAK_TIPI_LABELS,
  type TutanakIcerik,
} from "@/lib/db/schema";
import { TaskStatusTimeline } from "@/components/saha/task-status-timeline";
import { TaskNotesSection } from "@/components/saha/task-notes";
import { TaskPhotoGallery } from "@/components/saha/task-photo-gallery";
import { TutanakForm } from "@/components/saha/tutanak-form";
import { GorevDurumSelect } from "@/components/saha/gorev-durum-select";
import { TokenCopy } from "@/components/saha/token-copy";
import { ArrowLeft } from "lucide-react";

export default async function SahaGorevDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "saha_goruntuleme"))) {
    redirect("/dashboard");
  }
  const canEdit = await hasPermission(session?.user?.role, "saha_yonetimi");
  const { id } = await params;
  const gorevId = Number(id);
  const row = await getSahaGorevById(gorevId);
  if (!row) notFound();

  const { gorev, aboneNo, aboneAd, aboneSoyad, aboneAdres, ekipAd, personelAd, kacakTipi } =
    row;
  const [timeline, notes, photos, tutanak] = await Promise.all([
    getGorevDurumGecmisi(gorevId),
    getGorevNotlari(gorevId),
    getGorevFotograflari(gorevId),
    getGorevTutanak(gorevId),
  ]);

  let tutanakParsed: TutanakIcerik | null = null;
  if (tutanak?.icerik) {
    try {
      tutanakParsed = JSON.parse(tutanak.icerik) as TutanakIcerik;
    } catch {
      tutanakParsed = null;
    }
  }

  const defaults: TutanakIcerik = {
    tarih: new Date().toLocaleDateString("tr-TR"),
    ekipAd: ekipAd ?? "",
    aboneNo,
    aboneAdSoyad: `${aboneAd} ${aboneSoyad}`,
    adres: aboneAdres ?? undefined,
    tespitOzeti: kacakTipi
      ? KACAK_TIPI_LABELS[kacakTipi as keyof typeof KACAK_TIPI_LABELS] ?? kacakTipi
      : "—",
    sahaBulgusu: "",
    olcumNotu: "",
    imzaMetni: "",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/saha-operasyonlari/gorevler"
        className="inline-flex items-center gap-2 text-sm text-sky-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Görevlere dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Görev #{gorev.id}
          </h2>
          <p className="text-slate-700">
            {aboneNo} — {aboneAd} {aboneSoyad}
          </p>
          <p className="text-sm text-slate-600">{aboneAdres}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={gorev.durum === "sahada" ? "danger" : "default"}>
            {SAHA_GOREV_DURUM_LABELS[gorev.durum]}
          </Badge>
          <Badge variant="default">
            {SAHA_ONCELIK_LABELS[gorev.oncelik]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ekip & atama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-800">
            <p>
              <span className="text-slate-600">Ekip:</span> {ekipAd}
            </p>
            <p>
              <span className="text-slate-600">Personel:</span>{" "}
              {personelAd ?? "Atanmadı"}
            </p>
            {gorev.kacakTespitId && (
              <p>
                <span className="text-slate-600">Kaçak tespit:</span>{" "}
                <Link
                  href={`/dashboard/kacak-tespit?id=${gorev.kacakTespitId}`}
                  className="text-sky-600 hover:underline"
                >
                  #{gorev.kacakTespitId}
                </Link>
              </p>
            )}
            {canEdit && (
              <>
                <TokenCopy token={gorev.paylasimToken} />
                <div className="pt-2">
                  <p className="mb-2 text-xs font-medium text-slate-700">
                    Merkez durum güncelleme
                  </p>
                  <GorevDurumSelect gorevId={gorevId} current={gorev.durum} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durum geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskStatusTimeline
              items={timeline.map((t) => ({
                durum: t.kayit.durum,
                not: t.kayit.notMetni,
                kullaniciAd: t.kullaniciAd,
                createdAt: t.kayit.createdAt,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskNotesSection
              gorevId={gorevId}
              notes={notes.map((n) => ({
                id: n.not.id,
                icerik: n.not.icerik,
                kaynak: n.not.kaynak,
                kullaniciAd: n.kullaniciAd,
                createdAt: n.not.createdAt,
              }))}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fotoğraflar</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskPhotoGallery photos={photos} />
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Dijital tutanak</CardTitle>
          </CardHeader>
          <CardContent>
            <TutanakForm
              gorevId={gorevId}
              initial={tutanakParsed}
              defaults={defaults}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
