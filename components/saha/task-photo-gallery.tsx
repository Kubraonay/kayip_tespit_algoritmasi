export function TaskPhotoGallery({
  photos,
}: {
  photos: { id: number; dosyaYolu: string; aciklama: string | null; kaynak: string; createdAt: Date }[];
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-slate-700">Fotoğraf yok</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {photos.map((p) => (
        <div
          key={p.id}
          className="overflow-hidden rounded-lg border border-slate-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/saha/foto?path=${encodeURIComponent(p.dosyaYolu)}`}
            alt={p.aciklama ?? "Saha fotoğrafı"}
            className="h-40 w-full object-cover"
          />
          <p className="px-2 py-1 text-xs text-slate-700">
            {p.aciklama ?? "—"} · {p.kaynak} ·{" "}
            {new Date(p.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
      ))}
    </div>
  );
}
