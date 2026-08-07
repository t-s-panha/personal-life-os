"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Repeat,
  Clock,
  BarChart3,
  BookOpen,
  GraduationCap,
  Zap,
  Dumbbell,
  Moon,
  Settings,
  LogOut,
  FolderKanban,
  Library,
  ClipboardList,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/reading", label: "Reading", icon: Library },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { section: "Education", items: [
    { href: "/education", label: "Education", icon: GraduationCap },
    { href: "/skills", label: "Skills", icon: Zap },
    { href: "/focus", label: "Focus Timer", icon: BookOpen },
  ]},
  { section: "Fitness", items: [
    { href: "/fitness", label: "Fitness", icon: Dumbbell },
    { href: "/sleep", label: "Sleep", icon: Moon },
  ]},
  { href: "/reviews", label: "Reviews", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();

  const renderItem = (item: any) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="w-4 h-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r bg-card hidden md:flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight">Life OS</h2>
        <p className="text-xs text-muted-foreground mt-1">Personal Operating System</p>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item: any) => {
          if (item.section) {
            return (
              <div key={item.section} className="mt-4 first:mt-0">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {item.section}
                </p>
                {item.items.map(renderItem)}
              </div>
            );
          }
          return renderItem(item);
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {user?.name?.[0] || user?.email?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
