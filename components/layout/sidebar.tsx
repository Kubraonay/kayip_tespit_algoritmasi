"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gauge,
  Network,
  BarChart3,
  BookOpen,
  Upload,
  Zap,
  LogOut,
  UserCircle,
  ScrollText,
  HardHat,
  BellRing,
  Radio,
} from "lucide-react";
import { ROL_LABELS, type UserRole } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/aboneler", label: "Aboneler", icon: Users },
  { href: "/dashboard/sayaclar", label: "Sayaçlar", icon: Gauge },
  { href: "/dashboard/sebeke", label: "Şebeke", icon: Network },
  { href: "/dashboard/kacak-tespit", label: "Kaçak Tespit", icon: BarChart3 },
  {
    href: "/dashboard/saha-operasyonlari",
    label: "Saha Operasyonları",
    icon: HardHat,
  },
  { href: "/dashboard/alarm-merkezi", label: "Alarm Merkezi", icon: BellRing },
  { href: "/dashboard/bildirimler/canli", label: "Canlı Bildirimler", icon: Radio },
  { href: "/dashboard/bilgilendirme", label: "Bilgilendirme", icon: BookOpen },
  { href: "/dashboard/veri-aktar", label: "Veri Aktar", icon: Upload },
  { href: "/dashboard/loglar", label: "İşlem Logları", icon: ScrollText },
  { href: "/dashboard/profil", label: "Profil", icon: UserCircle },
];

export function Sidebar({
  userName,
  userRole,
}: {
  userName?: string | null;
  userRole?: string;
}) {
  const rolLabel =
    userRole && userRole in ROL_LABELS
      ? ROL_LABELS[userRole as UserRole]
      : null;
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">Akdeniz Dağıtım</p>
          <p className="text-xs text-slate-400">Kayıp Kaçak Tespit</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sky-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700 p-4">
        <Link
          href="/dashboard/profil"
          className="mb-2 block truncate rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          {userName && <span className="block font-medium">{userName}</span>}
          {rolLabel && <span>{rolLabel}</span>}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Çıkış
        </button>
      </div>
    </aside>
  );
}
