import { cn } from "@/lib/ui/cn";

// Placeholder de carregamento — mesmo bg-ink-800 do resto do design system,
// só com pulse. Usado nos loading.tsx de cada rota (ver app/*/loading.tsx)
// pra dar feedback imediato no clique enquanto o Server Component busca os
// dados reais.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-ink-800/80", className)} />;
}
