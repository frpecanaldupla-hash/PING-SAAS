import Link from "next/link";
import { ArrowRight, ScanLine, CalendarClock, Gift, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PingMark } from "@/components/shared/PingMark";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { BarberPole } from "@/components/ui/BarberPole";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Landing pública (deslogada). O hub autenticado da equipe vive em
// /dashboard; o hub autenticado do cliente vive em /cliente (login
// próprio em /cliente/entrar, ver lib/client-portal/session.ts).
//
// A página tem DOIS públicos diferentes, e cada um precisa de um caminho
// óbvio — mas eles não têm o mesmo peso: quem paga pelo PING é o dono da
// barbearia/salão, não o cliente dele. Por isso "Testar grátis" continua
// sendo o CTA dominante; "Já sou cliente" é claramente secundário (contorno,
// não preenchido), mas nunca escondido — ninguém devia ter que adivinhar
// que existe uma Área do Cliente.

function Feature({
  icon: Icon,
  children,
  delay,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  delay: string;
}) {
  return (
    <div
      className="group flex items-center gap-3 text-[15px] font-medium text-paper-400 animate-rise"
      style={{ animationDelay: delay }}
    >
      <span className="w-[30px] h-[30px] rounded-[8px] shrink-0 flex items-center justify-center bg-gradient-to-b from-ink-800 to-ink-900 border border-steel-800 shadow-[inset_0_1px_0_rgba(247,244,238,0.05)] transition-all group-hover:border-signal-400/50 group-hover:shadow-[inset_0_1px_0_rgba(247,244,238,0.05),0_0_12px_rgba(232,67,47,0.25)]">
        <Icon size={14} className="text-steel-400 transition-colors group-hover:text-signal-300" />
      </span>
      <span>{children}</span>
    </div>
  );
}

// Barras de "onda sonora" do badge da marca — o ping sendo ouvido.
function WaveBars() {
  const bars: [string, string][] = [
    ["35%", "0s"],
    ["100%", "0.12s"],
    ["60%", "0.24s"],
    ["85%", "0.36s"],
    ["45%", "0.48s"],
  ];
  return (
    <span aria-hidden className="flex items-center gap-[3px] h-[17px]">
      {bars.map(([height, delay]) => (
        <span
          key={delay}
          className="w-[3px] rounded-full bg-signal-400 animate-wave-bounce"
          style={{ height, animationDelay: delay, boxShadow: "0 0 6px 1px rgba(255,91,61,0.8)" }}
        />
      ))}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="relative bg-ink-950 text-paper-50 min-h-screen overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <header className="border-b border-ink-800/80">
          <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-signal-400 shadow-[0_0_10px_3px_rgba(255,91,61,0.7)]" />
              <span className="font-display text-2xl tracking-wide">PING</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/cliente/entrar"
                className="hidden sm:block text-sm text-paper-400 hover:text-paper-50 transition-colors px-2 py-1"
              >
                Sou cliente
              </Link>
              <Link
                href="/login"
                className="text-sm text-paper-400 hover:text-paper-50 transition-colors px-2 py-1"
              >
                Entrar
              </Link>
              <ButtonLink href="/cadastro" size="md">
                Testar grátis
              </ButtonLink>
            </div>
          </div>
        </header>

        {/* Hero — a tese do produto em uma frase, com o próprio "ping" como imagem */}
        <section className="max-w-6xl mx-auto px-6 pt-14 lg:pt-20 pb-16 lg:pb-20 grid lg:grid-cols-[1fr_400px] items-center gap-8 lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 border border-ink-700 bg-ink-900/60 px-3.5 py-1.5 rounded-full mb-8 text-xs text-paper-400 animate-rise">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-400" />
              Feito para barbearias e salões que vivem lotados
            </div>

            <h1
              className="font-display text-7xl lg:text-8xl leading-[0.92] tracking-wide mb-8 animate-rise"
              style={{ textShadow: "0 0 42px rgba(232,67,47,0.28)", animationDelay: "0.08s" }}
            >
              Dá um{" "}
              <em
                className="not-italic bg-gradient-to-br from-signal-300 to-signal-500 bg-clip-text text-transparent"
                style={{ filter: "drop-shadow(0 0 18px rgba(255,91,61,0.45))" }}
              >
                PING
              </em>
              <br />
              aí
            </h1>

            <div className="flex flex-col gap-3.5 mb-10">
              <Feature icon={ScanLine} delay="0.16s">
                Check-in por <b className="text-paper-50 font-semibold">QR Code</b> — cliente
                chega, ponto somado
              </Feature>
              <Feature icon={CalendarClock} delay="0.24s">
                Agenda cheia em <b className="text-paper-50 font-semibold">3 toques</b>, direto
                do celular do cliente
              </Feature>
              <Feature icon={Gift} delay="0.32s">
                Fidelidade <b className="text-paper-50 font-semibold">automática</b> — do seu
                jeito, sem planilha
              </Feature>
            </div>

            <div
              className="flex flex-wrap items-center gap-4 mb-3 animate-rise"
              style={{ animationDelay: "0.4s" }}
            >
              <ButtonLink href="/cadastro" size="lg">
                Testar grátis
                <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink href="/cliente/entrar" variant="outline" size="lg">
                <QrCode size={18} />
                Já sou cliente
              </ButtonLink>
            </div>
            <p
              className="font-mono text-xs text-paper-500 mb-6 animate-rise"
              style={{ animationDelay: "0.48s" }}
            >
              leva menos de 2 minutos · <b className="text-brass-300 font-medium">grátis</b>
            </p>

            <Link
              href="/dashboard"
              className="text-sm text-paper-400 hover:text-paper-50 transition-colors underline underline-offset-4 decoration-ink-700"
            >
              Ver o painel em ação
            </Link>
          </div>

          {/* O palco do PingMark — ordem invertida no mobile pra marca abrir a página */}
          <div className="relative flex justify-center order-first lg:order-none animate-rise">
            <div className="relative flex items-center justify-center py-6">
              <PingMark size={320} variant="hero" />
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-ink-700 bg-ink-900/85 px-5 py-2.5 backdrop-blur-md"
                style={{
                  boxShadow:
                    "0 8px 24px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(247,244,238,0.05)",
                }}
              >
                <WaveBars />
                <b className="font-display text-[15px] tracking-[0.09em] font-normal">
                  DÁ UM <span className="text-signal-300">PING</span> AÍ
                </b>
              </div>
            </div>
          </div>
        </section>

        <BarberPole className="max-w-6xl mx-auto mb-14 lg:mb-16" />

        {/* Prova — três consequências concretas de usar o produto, não features soltas */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-5">
            <Card interactive className="p-8">
              <ScanLine size={32} className="text-brass-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold mb-2">Cliente chega, já ganhou ponto</h3>
              <p className="text-paper-500 text-sm leading-relaxed">
                Sem crachá, sem app pra baixar. O QR Code fica na Área do Cliente, o check-in
                acontece na hora e a fidelidade soma sozinha.
              </p>
            </Card>
            <Card interactive className="p-8">
              <CalendarClock size={32} className="text-brass-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold mb-2">Agenda cheia em 3 toques</h3>
              <p className="text-paper-500 text-sm leading-relaxed">
                Serviço, horário, confirmar. O cliente agenda do celular dele e a sua agenda
                enche sem uma ligação sequer.
              </p>
            </Card>
            <Card interactive tone="gold" className="p-8">
              <Gift size={32} className="text-brass-300 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold mb-2">Fidelidade do seu jeito</h3>
              <p className="text-paper-500 text-sm leading-relaxed">
                Você decide quantos pontos por visita e o que vale o resgate — sem níveis
                fixos de Bronze a Diamante que não fazem sentido pro seu negócio.
              </p>
            </Card>
          </div>
        </section>

        {/* Rodapé de conversão — reforça o caminho do cliente uma segunda vez,
            pra quem rolou a página inteira sem clicar em nada no topo. */}
        <section className="border-t border-ink-800 py-16 text-center">
          <p className="text-paper-500 text-sm mb-3">
            Já é cliente de uma barbearia ou salão que usa o PING?
          </p>
          <Link
            href="/cliente/entrar"
            className="inline-flex items-center gap-2 text-signal-400 font-semibold hover:text-signal-300 transition-colors"
          >
            Acessar sua área <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
