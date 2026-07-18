import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Placeholder da rota /servicos — implementado em fase futura do PING.
export default function ServicosPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-paper-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-signal-500 text-xs font-semibold tracking-[0.2em] uppercase">
        Em construção
      </p>
      <h1 className="font-display text-4xl tracking-wide">servicos</h1>
      <p className="text-paper-500 text-sm max-w-xs">
        Este módulo entra em uma próxima fase do PING.
      </p>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-paper-400 hover:text-paper-50 mt-4">
        <ArrowLeft size={16} /> Voltar ao início
      </Link>
    </div>
  );
}
