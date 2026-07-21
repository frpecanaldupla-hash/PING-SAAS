import Link from "next/link";
import { cn } from "@/lib/ui/cn";

// Botões do design system PING. Três variantes:
// - primary: o CTA de vitrine — gradiente signal com glow neon, texto ink.
//   No máximo UM por tela; é o "aperte aqui" da página.
// - outline: ação secundária — contorno, sem preenchimento.
// - ghost:   ação terciária — só texto, para links de apoio.
//
// Button (nativo) e ButtonLink (next/link) compartilham exatamente as
// mesmas classes via buttonClasses() — usar um ou outro é decisão de
// semântica (submit/onClick vs navegação), nunca de aparência.

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: cn(
    "bg-gradient-to-br from-signal-400 to-signal-500 text-ink-950",
    "shadow-[0_0_0_1px_rgba(255,91,61,0.35),0_10px_32px_-8px_rgba(232,67,47,0.6),inset_0_1px_0_rgba(255,255,255,0.28)]",
    "hover:-translate-y-0.5",
    "hover:shadow-[0_0_0_1px_rgba(255,91,61,0.55),0_16px_44px_-8px_rgba(232,67,47,0.85),0_0_28px_rgba(255,91,61,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]",
    "disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_0_0_1px_rgba(255,91,61,0.35),0_10px_32px_-8px_rgba(232,67,47,0.6),inset_0_1px_0_rgba(255,255,255,0.28)]"
  ),
  outline: cn(
    "border border-ink-700 text-paper-50",
    "hover:border-paper-500",
    "disabled:opacity-60 disabled:hover:border-ink-700"
  ),
  ghost: "text-paper-400 hover:text-paper-50 disabled:opacity-60",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-4 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-all",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
}) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
