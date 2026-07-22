import { Atmosphere } from "@/components/ui/Atmosphere";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ServicosLoading() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />
      <div className="relative z-10">
        <PageHeader title="Serviços" subtitle={<Skeleton className="h-3 w-32" />} />
        <main className="px-5 lg:px-10 py-6 max-w-3xl mx-auto space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </main>
      </div>
    </div>
  );
}
