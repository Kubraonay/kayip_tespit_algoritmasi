import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { getSahaEkipleri } from "@/lib/db/queries-saha";
import { getSebekeTree } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamForm } from "@/components/saha/team-form";

export default async function SahaEkiplerPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "saha_goruntuleme"))) {
    redirect("/dashboard");
  }
  const canEdit = await hasPermission(session?.user?.role, "saha_yonetimi");
  const ekipler = await getSahaEkipleri();
  const { trafolar } = await getSebekeTree();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Saha Ekipleri</h2>
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni ekip</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamForm trafolar={trafolar} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Kayıtlı ekipler ({ekipler.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-700">
                <th className="py-2">Kod</th>
                <th>Ad</th>
                <th>Bölge</th>
                <th>Trafo</th>
              </tr>
            </thead>
            <tbody>
              {ekipler.map(({ ekip, trafoKod }) => (
                <tr key={ekip.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-900">{ekip.kod}</td>
                  <td className="text-slate-800">{ekip.ad}</td>
                  <td className="text-slate-700">{ekip.bolge ?? "—"}</td>
                  <td className="text-slate-700">{trafoKod ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
