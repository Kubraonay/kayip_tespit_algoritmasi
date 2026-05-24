"use client";

import Link from "next/link";
import { AlarmNotificationCenter } from "@/components/alarmlar/alarm-notification-center";
import { UserCircle } from "lucide-react";
import { HamburgerIcon } from "@/components/ui/hamburger-icon";
import { ROL_LABELS, type UserRole } from "@/lib/auth/permissions";
export function DashboardHeader({
  userName,
  role,
  onMenuToggle,
  sidebarOpen = true,
}: {
  userName?: string | null;
  role?: string;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}) {
  const rolLabel =
    role && role in ROL_LABELS
      ? ROL_LABELS[role as UserRole]
      : role ?? "Kullanıcı";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuToggle && !sidebarOpen && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Menüyü aç"
            aria-expanded={sidebarOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
          >
            <HamburgerIcon />
          </button>
        )}
        <h1 className="truncate text-base font-semibold text-slate-800 sm:text-lg">
          Kayıp Kaçak Tespit Platformu
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <AlarmNotificationCenter />
        <Link
          href="/dashboard/profil"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-sm transition-colors hover:bg-slate-50 sm:px-3"
        >
          <UserCircle className="h-5 w-5 text-sky-600" />
          <div className="hidden text-left sm:block">
            <p className="font-medium text-slate-800">{userName ?? "Profil"}</p>
            <p className="text-xs text-slate-800">{rolLabel}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
