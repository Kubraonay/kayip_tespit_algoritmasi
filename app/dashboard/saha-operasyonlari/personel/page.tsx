import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getSahaPersonelleri, getSahaEkipleri } from "@/lib/db/queries-saha";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonnelForm } from "@/components/saha/personnel-form";

export default async function SahaPersonelPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "saha_goruntuleme"))) {
    redirect("/dashboard");
  }
  const canEdit = await hasPermission(session?.user?.role, "saha_yonetimi");
  const personeller = await getSahaPersonelleri();
  const ekipler = (await getSahaEkipleri()).map((e) => ({
    id: e.ekip.id,
    kod: e.ekip.kod,
    ad: e.ekip.ad,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Saha Personeli</h2>
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni personel</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonnelForm ekipler={ekipler} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Personel listesi ({personeller.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-700">
                <th className="py-2">Sicil</th>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>Ekip</th>
                <th>Ünvan</th>
              </tr>
            </thead>
            <tbody>
              {personeller.map(({ personel, ekipKod, ekipAd }) => (
                <tr key={personel.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-900">
                    {personel.sicilNo}
                  </td>
                  <td className="text-slate-800">{personel.adSoyad}</td>
                  <td className="text-slate-700">{personel.telefon ?? "—"}</td>
                  <td className="text-slate-700">
                    {ekipKod ? `${ekipKod} — ${ekipAd}` : "—"}
                  </td>
                  <td className="text-slate-700">{personel.unvan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
