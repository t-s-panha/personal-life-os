"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QuickEntryModal } from "@/components/QuickEntryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import {
  Menu,
  LayoutDashboard,
  CheckSquare,
  Target,
  Repeat,
  Clock,
  FolderKanban,
  Library,
  BookOpen,
  GraduationCap,
  Zap,
  Dumbbell,
  Moon,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/reading", label: "Reading", icon: Library },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/education", label: "Education", icon: GraduationCap },
  { href: "/skills", label: "Skills", icon: Zap },
  { href: "/focus", label: "Focus Timer", icon: BookOpen },
  { href: "/fitness", label: "Fitness", icon: Dumbbell },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/reviews", label: "Reviews", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Header({ user }: { user: any }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-3 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileNavOpen(true)}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground touch-manipulation"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-bold text-base tracking-tight">Life OS</span>
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        <QuickEntryModal />
        <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
          {user?.name || user?.email}
        </span>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="fixed inset-y-0 left-0 top-0 translate-x-0 translate-y-0 z-50 flex flex-col w-72 max-w-[85vw] h-dvh max-h-dvh p-0 bg-card border-r shadow-2xl rounded-none border-t-0 border-b-0 border-l-0">
          {/* Drawer Header (Fixed) */}
          <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">Life OS</DialogTitle>
              <p className="text-xs text-muted-foreground">Personal Operating System</p>
            </div>
          </DialogHeader>

          {/* Drawer Navigation List (Scrollable flex-1) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Drawer Footer (Fixed Sign Out & User Info) */}
          <div className="p-3 border-t shrink-0 bg-card/95 backdrop-blur space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.[0] || user?.email?.[0] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{user?.name || user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileNavOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors touch-manipulation min-h-[40px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
