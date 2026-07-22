import { PingMark } from "@/components/shared/PingMark";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BusinessProfileLoading() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 px-6 py-12 overflow-x-hidden">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
          <PingMark size={88} />
          <Skeleton className="h-8 w-40 mt-4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
