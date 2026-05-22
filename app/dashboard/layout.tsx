import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SessionProvider } from "@/components/providers/session-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          userName={session.user.name}
          userRole={session.user.role}
        />
        <main className="flex-1 overflow-auto">
          <DashboardHeader
            userName={session.user.name}
            role={session.user.role}
          />
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
