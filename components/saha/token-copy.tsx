"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TokenCopy({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/saha/gorev/${token}`
      : `/saha/gorev/${token}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
      <p className="text-xs font-medium text-sky-900">Saha paylaşım linki</p>
      <p className="mt-1 break-all font-mono text-xs text-slate-800">{url}</p>
      <Button type="button" size="sm" className="mt-2" variant="outline" onClick={copy}>
        {copied ? "Kopyalandı" : "Linki kopyala"}
      </Button>
    </div>
  );
}
