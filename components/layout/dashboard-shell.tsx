"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardAccessWrapper } from "@/components/layout/dashboard-access-wrapper";
import { cn } from "@/lib/utils";
import type { PermissionKey } from "@/lib/auth/permissions";

const STORAGE_KEY = "dashboard-sidebar-open";

function useIsLg() {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isLg;
}

export function DashboardShell({
  userName,
  userRole,
  permissions,
  children,
}: {
  userName?: string | null;
  userRole?: string;
  permissions: PermissionKey[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLg = useIsLg();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setDesktopOpen(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(desktopOpen));
    } catch {
      /* ignore */
    }
  }, [desktopOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleMenuToggle = useCallback(() => {
    if (isLg) {
      setDesktopOpen((o) => !o);
    } else {
      setMobileOpen((o) => !o);
    }
  }, [isLg]);

  const sidebarOpen = isLg ? desktopOpen : mobileOpen;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <SidebarNav
        userName={userName}
        userRole={userRole}
        permissions={permissions}
        onNavigate={closeMobile}
        onClose={closeMobile}
        onMenuToggle={handleMenuToggle}
        sidebarOpen={sidebarOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width,opacity,margin]",
          desktopOpen
            ? "lg:w-64 lg:opacity-100"
            : "lg:pointer-events-none lg:w-0 lg:overflow-hidden lg:opacity-0"
        )}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        <DashboardHeader
          userName={userName}
          role={userRole}
          onMenuToggle={handleMenuToggle}
          sidebarOpen={sidebarOpen}
        />
        <DashboardAccessWrapper permissions={permissions}>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </DashboardAccessWrapper>
      </main>
    </div>
  );
}
