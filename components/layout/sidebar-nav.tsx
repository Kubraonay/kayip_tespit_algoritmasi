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
  UserCog,
  KeyRound,
  X,
} from "lucide-react";
import { HamburgerIcon } from "@/components/ui/hamburger-icon";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  hasPermissionInList,
  ROL_LABELS,
  type PermissionKey,
  type UserRole,
} from "@/lib/auth/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: PermissionKey;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "rapor_goruntuleme" },
  { href: "/dashboard/aboneler", label: "Aboneler", icon: Users, permission: "rapor_goruntuleme" },
  { href: "/dashboard/sayaclar", label: "Sayaçlar", icon: Gauge, permission: "rapor_goruntuleme" },
  { href: "/dashboard/sebeke", label: "Şebeke", icon: Network, permission: "veri_duzenleme" },
  { href: "/dashboard/kacak-tespit", label: "Kaçak Tespit", icon: BarChart3, permission: "kacak_goruntuleme" },
  { href: "/dashboard/saha-operasyonlari", label: "Saha Operasyonları", icon: HardHat, permission: "saha_goruntuleme" },
  { href: "/dashboard/alarm-merkezi", label: "Alarm Merkezi", icon: BellRing, permission: "alarm_goruntuleme" },
  { href: "/dashboard/bilgilendirme", label: "Bilgilendirme", icon: BookOpen, permission: "bilgilendirme_goruntuleme" },
  { href: "/dashboard/veri-aktar", label: "Veri Aktar", icon: Upload, permission: "veri_aktar" },
  { href: "/dashboard/loglar", label: "İşlem Logları", icon: ScrollText, permission: "log_goruntuleme" },
];

const yetkiNav: NavItem[] = [
  { href: "/dashboard/yetki-yonetimi/kullanicilar", label: "Kullanıcı Yönetimi", icon: UserCog, permission: "kullanici_yonetimi" },
  { href: "/dashboard/yetki-yonetimi/roller", label: "Roller & Yetkiler", icon: KeyRound, permission: "rol_yonetimi" },
];

export function SidebarNav({
  userName,
  userRole,
  permissions,
  className,
  onNavigate,
  onClose,
  onMenuToggle,
  sidebarOpen = true,
}: {
  userName?: string | null;
  userRole?: string;
  permissions: PermissionKey[];
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}) {
  const pathname = usePathname();
  const rolLabel =
    userRole && userRole in ROL_LABELS
      ? ROL_LABELS[userRole as UserRole]
      : null;

  const visibleNav = nav.filter((item) =>
    hasPermissionInList(permissions, item.permission)
  );
  const visibleYetki = yetkiNav.filter((item) =>
    hasPermissionInList(permissions, item.permission)
  );

  return (
    <aside
      className={cn(
        "flex w-64 flex-col bg-slate-900 text-slate-100",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Akdeniz Dağıtım</p>
            <p className="truncate text-xs text-slate-400">Kayıp Kaçak Tespit</p>
          </div>
        </div>
        {onMenuToggle && sidebarOpen && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Menüyü kapat"
            aria-expanded={sidebarOpen}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 transition-colors hover:bg-slate-700 lg:flex"
          >
            <HamburgerIcon />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
        {visibleYetki.length > 0 && (
          <>
            <p className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Yetki Yönetimi
            </p>
            {visibleYetki.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
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
          </>
        )}
      </nav>
      <div className="border-t border-slate-700 p-4">
        <Link
          href="/dashboard/profil"
          onClick={onNavigate}
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
