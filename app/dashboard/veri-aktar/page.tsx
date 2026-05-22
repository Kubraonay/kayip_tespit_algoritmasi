import { CsvImportFull } from "@/components/import/csv-import-full";

export default function VeriAktarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Veri Aktar</h2>
        <p className="text-slate-700">
          CSV dosyası ile abone ve aylık tüketim verisi yükleyin
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <CsvImportFull tip="aboneler" title="Abone İçe Aktarma" />
        <CsvImportFull tip="tuketim" title="Tüketim İçe Aktarma" />
      </div>
    </div>
  );
}
