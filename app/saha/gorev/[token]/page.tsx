import { notFound } from "next/navigation";
import { getSahaGorevByToken } from "@/lib/db/queries-saha";
import { KACAK_TIPI_LABELS, type TutanakIcerik } from "@/lib/db/schema";
import { FieldTaskClient } from "@/components/saha/field-task-client";

export default async function SahaFieldGorevPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = await getSahaGorevByToken(token);
  if (!row) notFound();

  const defaults: TutanakIcerik = {
    tarih: new Date().toLocaleDateString("tr-TR"),
    ekipAd: row.ekipAd ?? "",
    aboneNo: row.aboneNo,
    aboneAdSoyad: `${row.aboneAd} ${row.aboneSoyad}`,
    adres: row.aboneAdres ?? undefined,
    tespitOzeti: row.kacakTipi
      ? KACAK_TIPI_LABELS[row.kacakTipi as keyof typeof KACAK_TIPI_LABELS] ??
        row.kacakTipi
      : row.kacakAnlatim?.slice(0, 120) ?? "—",
    sahaBulgusu: "",
    olcumNotu: "",
    imzaMetni: row.personelAd ?? "",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <FieldTaskClient
        token={token}
        gorev={{
          durum: row.gorev.durum,
          personelId: row.personelId,
          aboneNo: row.aboneNo,
          aboneAd: row.aboneAd,
          aboneSoyad: row.aboneSoyad,
          aboneAdres: row.aboneAdres,
          ekipAd: row.ekipAd ?? "",
          kacakTipi: row.kacakTipi,
        }}
        defaults={defaults}
      />
    </div>
  );
}
