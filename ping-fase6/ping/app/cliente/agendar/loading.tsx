import { Atmosphere } from "@/components/ui/Atmosphere";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AgendarLoading() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />
      <div className="relative z-10">
        <PageHeader title="Agendar" backHref="/cliente" />
        <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </main>
      </div>
    </div>
  );
}
