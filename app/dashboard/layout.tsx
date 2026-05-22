import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SessionProvider } from "@/components/providers/session-provider";
import { AlarmToastProvider } from "@/components/alarmlar/toast-provider";
import { DashboardAccessWrapper } from "@/components/layout/dashboard-access-wrapper";
import { getRolePermissions } from "@/lib/db/queries-rbac";
import { normalizeUserRole } from "@/lib/auth/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role =
    normalizeUserRole(session.user.role) ?? session.user.role ?? undefined;
  const permissions = role ? await getRolePermissions(role) : [];

  return (
    <SessionProvider session={session}>
      <AlarmToastProvider>
        <div className="flex min-h-screen bg-slate-50">
          <SidebarNav
            userName={session.user.name}
            userRole={role}
            permissions={permissions}
          />
          <main className="flex-1 overflow-auto">
            <DashboardHeader
              userName={session.user.name}
              role={role}
            />
            <DashboardAccessWrapper permissions={permissions}>
              <div className="p-8">{children}</div>
            </DashboardAccessWrapper>
          </main>
        </div>
      </AlarmToastProvider>
    </SessionProvider>
  );
}
