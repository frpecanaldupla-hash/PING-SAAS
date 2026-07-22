import { Atmosphere } from "@/components/ui/Atmosphere";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ClienteLoading() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />
      <div className="relative z-10">
        <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800/80">
          <div>
            <h1 className="font-display text-3xl tracking-wide leading-none">Sua área</h1>
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        </header>

        <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </main>
      </div>
    </div>
  );
}
