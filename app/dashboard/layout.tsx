import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { AlarmToastProvider } from "@/components/alarmlar/toast-provider";
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
        <DashboardShell
          userName={session.user.name}
          userRole={role}
          permissions={permissions}
        >
          {children}
        </DashboardShell>
      </AlarmToastProvider>
    </SessionProvider>
  );
}
