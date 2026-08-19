import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { navForRole } from "@/lib/nav";
import { ROLE_LABELS } from "@/lib/rbac";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = navForRole(session.role);

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 flex-col bg-primary-900 md:flex">
        <Link href="/dashboard" className="px-5 py-5 text-xl font-extrabold text-white">
          Auto360
        </Link>
        <div className="flex-1 overflow-y-auto">
          <Sidebar items={items} />
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="px-3 py-2 text-xs text-white/60">
            <p className="font-medium text-white">
              {session.prenom} {session.nom}
            </p>
            <p>{ROLE_LABELS[session.role]}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white px-5 py-3 md:hidden">
          <Link href="/dashboard" className="text-lg font-extrabold text-primary-700">
            Auto360
          </Link>
          <MobileNav items={items} />
        </header>
        <main className="flex-1 bg-background p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
