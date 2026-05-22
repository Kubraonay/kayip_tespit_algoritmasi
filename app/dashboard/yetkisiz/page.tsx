import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function YetkisizPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-lg">
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldOff className="h-8 w-8 text-amber-600" />
            <CardTitle>Erişim reddedildi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <p>
            Bu sayfaya veya işleme erişim yetkiniz bulunmuyor. Erişim denemeniz
            kayıt altına alınmış olabilir.
          </p>
          {sp.from && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs">
              {sp.from}
            </p>
          )}
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Dashboard&apos;a dön
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
