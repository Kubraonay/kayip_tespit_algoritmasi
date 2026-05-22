"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserCircle } from "lucide-react";
import { ROL_LABELS, type UserRole } from "@/lib/auth/permissions";

export function DashboardHeader({
  userName,
  role,
}: {
  userName?: string | null;
  role?: string;
}) {
  const rolLabel =
    role && role in ROL_LABELS
      ? ROL_LABELS[role as UserRole]
      : role ?? "Kullanıcı";

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <h1 className="text-lg font-semibold text-slate-800">
        Kayıp Kaçak Tespit Platformu
      </h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <Link
          href="/dashboard/profil"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:bg-slate-50"
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
