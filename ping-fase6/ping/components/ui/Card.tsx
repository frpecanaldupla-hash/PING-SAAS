import { cn } from "@/lib/ui/cn";

// Cartão base do design system — evolução do `.ping-card` de globals.css
// (que continua existindo pras telas antigas até cada uma ser migrada).
// Fundo em gradiente sutil ink-900→850 pra dar volume, highlight interno
// no topo, e dois tons:
// - default: neutro
// - gold:    reservado a fidelidade/premium — borda e brilho de latão
// `interactive` liga o hover de levantar (usar quando o card inteiro é
// clicável ou representa algo acionável).
export function Card({
  tone = "default",
  interactive = false,
  className,
  children,
}: {
  tone?: "default" | "gold";
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg border bg-gradient-to-br from-ink-900 to-ink-850",
        "shadow-[inset_0_1px_0_rgba(247,244,238,0.04),0_12px_32px_-16px_rgba(0,0,0,0.6)]",
        tone === "default" && "border-ink-700",
        tone === "gold" && "border-brass-500/40",
        interactive &&
          "transition-all hover:-translate-y-0.5 hover:border-signal-400/35 hover:shadow-[inset_0_1px_0_rgba(247,244,238,0.05),0_14px_34px_-14px_rgba(232,67,47,0.35)]",
        interactive &&
          tone === "gold" &&
          "hover:border-brass-300/60 hover:shadow-[inset_0_1px_0_rgba(247,244,238,0.05),0_14px_34px_-14px_rgba(201,162,39,0.4)]",
        className
      )}
    >
      {tone === "gold" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 85% 0%, rgba(201,162,39,0.13) 0%, transparent 55%)",
          }}
        />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}
