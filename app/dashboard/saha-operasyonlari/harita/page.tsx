import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/db/queries-rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SahaOperationsMap } from "@/components/saha/saha-operations-map";

export default async function SahaHaritaPage() {
  const session = await auth();
  if (!(await hasPermission(session?.user?.role, "saha_goruntuleme"))) {
    redirect("/dashboard");
  }
  const canSimulate = await hasPermission(session?.user?.role, "saha_yonetimi");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Saha Haritası</h2>
        <p className="text-slate-700">
          Aktif görev hedefleri ve ekip konumları (20 sn otomatik yenileme)
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Canlı konum</CardTitle>
        </CardHeader>
        <CardContent>
          <SahaOperationsMap canSimulate={canSimulate} />
        </CardContent>
      </Card>
    </div>
  );
}
