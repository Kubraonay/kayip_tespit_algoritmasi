"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getRequiredPermission,
} from "@/lib/auth/route-access";
import {
  hasPermissionInList,
  type PermissionKey,
} from "@/lib/auth/permissions";

export function DashboardAccessWrapper({
  permissions,
  children,
}: {
  permissions: PermissionKey[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const required = getRequiredPermission(pathname);
    if (!required) return;
    if (!hasPermissionInList(permissions, required)) {
      const q = new URLSearchParams({ from: pathname });
      router.replace(`/dashboard/yetkisiz?${q.toString()}`);
    }
  }, [pathname, permissions, router]);

  return <>{children}</>;
}
