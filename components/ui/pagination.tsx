"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  paramName = "page",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  paramName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, String(p));
    return `${pathname}?${params.toString()}`;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-sm text-slate-700">
        {total === 0
          ? "Kayıt yok"
          : `${start}–${end} / ${total} kayıt`}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={href(Math.max(1, page - 1))}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200",
            page <= 1 && "pointer-events-none opacity-40"
          )}
          aria-disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 ||
              p === totalPages ||
              (p >= page - 1 && p <= page + 1)
          )
          .map((p, idx, arr) => {
            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && (
                  <span className="px-1 text-slate-700">…</span>
                )}
                <Link
                  href={href(p)}
                  className={cn(
                    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium",
                    p === page
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {p}
                </Link>
              </span>
            );
          })}
        <Link
          href={href(Math.min(totalPages, page + 1))}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200",
            page >= totalPages && "pointer-events-none opacity-40"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
