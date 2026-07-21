import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Cabeçalho padrão das telas internas (Agenda, Financeiro, RH...) —
// substitui o <header> copiado e colado em cada page.tsx: seta de voltar,
// título em Bebas, subtítulo pequeno e um slot à direita pra ação da tela
// (ex: o botão "Novo agendamento" da Agenda).
export function PageHeader({
  title,
  subtitle,
  backHref = "/dashboard",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 lg:px-10 py-5 border-b border-ink-800/80">
      <div className="flex items-center gap-4 min-w-0">
        <Link
          href={backHref}
          aria-label="Voltar"
          className="text-paper-500 hover:text-paper-50 transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-3xl tracking-wide leading-none truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-paper-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
