"use client";

import { useState } from "react";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScanAlarmsButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/alarmlar/scan", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.error) setMsg(data.error);
    else setMsg(`${data.created} yeni alarm oluşturuldu`);
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" onClick={run} disabled={loading}>
        <Radar className="h-4 w-4" />
        {loading ? "Taranıyor…" : "Alarm taraması çalıştır"}
      </Button>
      {msg && <span className="text-sm text-slate-700">{msg}</span>}
    </div>
  );
}
