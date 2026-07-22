import { Atmosphere } from "@/components/ui/Atmosphere";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ConfiguracoesLoading() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />
      <div className="relative z-10">
        <PageHeader title="Configurações" subtitle={<Skeleton className="h-3 w-32" />} />
        <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    </div>
  );
}
