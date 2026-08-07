import { QuickEntryModal } from "@/components/QuickEntryModal";

export function Header({ user }: { user: any }) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden font-bold">Life OS</div>
      <div className="flex items-center gap-3 ml-auto">
        <QuickEntryModal />
        <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
      </div>
    </header>
  );
}
