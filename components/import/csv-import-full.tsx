"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importAboneler, importTuketim } from "@/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TEMPLATES = {
  aboneler: "abone_no,ad,soyad,trafo_kod,fider_kod,tarife\nABN-00099,Test,Kullanici,TM-ANT-01,F1,mesken",
  tuketim: "seri_no,yil,ay,aktif_kwh\nSYC-ABN-00001,2025,12,450",
};

export function CsvImportFull({
  tip,
  title,
}: {
  tip: "aboneler" | "tuketim";
  title: string;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<{ basarili: number; hatalar: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATES[tip]], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tip}_sablon.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data as Record<string, string>[]);
        setResult(null);
      },
    });
    e.target.value = "";
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setLoading(true);
    const fn = tip === "aboneler" ? importAboneler : importTuketim;
    const res = await fn(rows);
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            Şablon İndir
          </Button>
          <label>
            <span className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50">
              CSV Yükle
            </span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
        </div>
        {rows.length > 0 && (
          <>
            <p className="text-xs text-slate-700">{rows.length} satır yüklendi</p>
            <div className="max-h-40 overflow-auto rounded border text-xs">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {Object.keys(rows[0]).map((k) => (
                      <th key={k} className="px-2 py-1 text-left">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(r).map((v, j) => (
                        <td key={j} className="px-2 py-1">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleImport} disabled={loading}>
              {loading ? "Aktarılıyor..." : `${rows.length} Satırı İçe Aktar`}
            </Button>
          </>
        )}
        {result && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium text-emerald-700">
              {result.basarili} kayıt başarılı
            </p>
            {result.hatalar.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-auto text-red-600">
                {result.hatalar.slice(0, 10).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
                {result.hatalar.length > 10 && (
                  <li>... ve {result.hatalar.length - 10} hata daha</li>
                )}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
