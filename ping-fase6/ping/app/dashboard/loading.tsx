import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800/80">
        <span className="font-display text-xl tracking-wide lg:hidden">PING</span>
        <Skeleton className="hidden lg:block h-4 w-24" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </header>

      <main className="flex-1 px-5 lg:px-10 py-8 max-w-6xl w-full mx-auto">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </section>
        <section className="mb-10">
          <Skeleton className="h-48 w-full" />
        </section>
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
