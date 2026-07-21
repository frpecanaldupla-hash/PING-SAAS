import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Junta classes condicionais (clsx) e resolve conflitos de utilitários
// Tailwind (twMerge) — ex: um `className` passado de fora consegue
// sobrescrever o padding padrão de um Button sem gerar CSS duplicado.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
