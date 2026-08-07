import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TimerProvider } from "@/context/TimerContext";
import { FloatingTimer } from "@/components/FloatingTimer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <TimerProvider>
      <div className="flex h-screen bg-background">
        <Sidebar user={session.user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={session.user} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
        <FloatingTimer />
      </div>
    </TimerProvider>
  );
}
