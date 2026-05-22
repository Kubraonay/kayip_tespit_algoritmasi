"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export function RunAnalysisButton({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/analiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(
        `${data.count} analiz, ${data.kacakCount ?? 0} kaçak tespiti (${data.donem})`
      );
      router.refresh();
    } else {
      setMessage(data.error ?? "Hata oluştu");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={run} disabled={loading}>
        <BarChart3 className="h-4 w-4" />
        {loading ? "Çalışıyor..." : "Analizi Çalıştır"}
      </Button>
      {message && (
        <span className="text-sm text-slate-700">{message}</span>
      )}
    </div>
  );
}
