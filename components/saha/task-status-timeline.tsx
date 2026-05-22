import { SAHA_GOREV_DURUM_LABELS } from "@/lib/db/schema";

export function TaskStatusTimeline({
  items,
}: {
  items: {
    durum: string;
    not: string | null;
    kullaniciAd: string | null;
    createdAt: Date;
  }[];
}) {
  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-sky-600 ring-4 ring-white" />
          <p className="text-sm font-semibold text-slate-900">
            {SAHA_GOREV_DURUM_LABELS[item.durum] ?? item.durum}
          </p>
          {item.not && (
            <p className="mt-0.5 text-sm text-slate-700">{item.not}</p>
          )}
          <p className="mt-1 text-xs text-slate-600">
            {item.kullaniciAd ?? "Saha"} ·{" "}
            {new Date(item.createdAt).toLocaleString("tr-TR")}
          </p>
        </li>
      ))}
    </ol>
  );
}
