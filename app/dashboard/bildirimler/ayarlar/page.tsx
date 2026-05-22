import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getBildirimAyarlari } from "@/lib/db/queries-alarmlar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettingsForm } from "@/components/alarmlar/notification-settings-form";

export default async function BildirimAyarlariPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ayar = await getBildirimAyarlari(Number(session.user.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bildirim Ayarları</h2>
        <p className="text-slate-700">
          E-posta, SMS ve push kanallarını yapılandırın
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kanal tercihleri</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettingsForm
            defaults={{
              emailAktif: ayar?.emailAktif ?? true,
              smsAktif: ayar?.smsAktif ?? false,
              pushAktif: ayar?.pushAktif ?? true,
              telefon: ayar?.telefon ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
