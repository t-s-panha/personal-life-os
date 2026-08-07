"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QuickEntryModal } from "@/components/QuickEntryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  X,
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
        <DialogContent className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full p-0 bg-card border-r shadow-xl translate-x-0 sm:max-w-xs rounded-none">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold">Life OS Navigation</DialogTitle>
          </DialogHeader>
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-60px)]">
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
        </DialogContent>
      </Dialog>
    </header>
  );
}
