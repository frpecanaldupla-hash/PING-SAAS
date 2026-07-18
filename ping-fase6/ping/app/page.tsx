import Link from "next/link";
import { ArrowRight, ScanLine, CalendarClock, Gift } from "lucide-react";
import { PingMark } from "@/components/shared/PingMark";

// Landing pública (deslogada). O hub autenticado vive em /dashboard.
// A tese da página é a mesma do produto: marcar presença é simples — um
// ping — então a agenda, o check-in e a fidelidade também deveriam ser.
export default function LandingPage() {
  return (
    <div className="bg-ink-950 text-paper-50 min-h-screen">
      <header className="border-b border-ink-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-500 shadow-ping" />
            <span className="font-display text-2xl tracking-wide">PING</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-paper-400 hover:text-paper-50 transition-colors">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-5 py-2.5 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold text-sm rounded-sm transition-colors"
            >
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — a tese do produto em uma frase, com o próprio "ping" como imagem */}
      <section className="max-w-6xl mx-auto px-6 pt-20 lg:pt-28 pb-24 grid lg:grid-cols-[1fr_auto] items-center gap-12">
        <div>
          <div className="inline-flex items-center gap-2 border border-ink-700 px-3.5 py-1.5 rounded-full mb-8 text-xs text-paper-400">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-500" />
            Feito para barbearias e salões que vivem lotados
          </div>
          <h1 className="font-display text-7xl lg:text-8xl leading-[0.92] tracking-wide mb-6">
            Dá um <span className="text-signal-500">PING</span><br />aí
          </h1>
          <p className="text-lg lg:text-xl text-paper-400 max-w-lg mb-10">
            Check-in por QR Code, agendamento em três toques e fidelidade que
            roda sozinha — enquanto você corta cabelo, não planilha.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-signal-500 hover:bg-signal-400 text-ink-950 px-7 py-4 rounded-sm text-base font-semibold transition-colors"
            >
              Experimentar agora
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-paper-400 hover:text-paper-50 transition-colors underline underline-offset-4 decoration-ink-700"
            >
              Ver o painel em ação
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex justify-center">
          <PingMark size={220} />
        </div>
      </section>

      {/* Prova — três consequências concretas de usar o produto, não features soltas */}
      <section className="border-t border-ink-800 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          <div className="ping-card p-8">
            <ScanLine size={32} className="text-brass-400 mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold mb-2">Cliente chega, já ganhou ponto</h3>
            <p className="text-paper-500 text-sm leading-relaxed">
              Sem crachá, sem app pra baixar. O QR Code fica na Área do
              Cliente, o check-in acontece na hora e a fidelidade soma
              sozinha.
            </p>
          </div>
          <div className="ping-card p-8">
            <CalendarClock size={32} className="text-brass-400 mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold mb-2">Agenda cheia em 3 toques</h3>
            <p className="text-paper-500 text-sm leading-relaxed">
              Serviço, horário, confirmar. O cliente agenda do celular dele
              e a sua agenda enche sem uma ligação sequer.
            </p>
          </div>
          <div className="ping-card p-8">
            <Gift size={32} className="text-brass-400 mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold mb-2">Fidelidade do seu jeito</h3>
            <p className="text-paper-500 text-sm leading-relaxed">
              Você decide quantos pontos por visita e o que vale o resgate —
              sem níveis fixos de Bronze a Diamante que não fazem sentido
              pro seu negócio.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
