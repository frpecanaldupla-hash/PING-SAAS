import Link from "next/link";
import {
  CalendarDays, ScanLine, Scissors,
  Gift, Users, Wallet, Megaphone, ArrowRight,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ModuleCard } from "@/components/shared/ModuleCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { PingMark } from "@/components/shared/PingMark";
import { MOCK_CLIENTS, MOCK_TRANSACTIONS } from "@/lib/mock/data";
import { todayRevenue, activeClientsCount, returnRate } from "@/lib/mock/metrics";

// Hub pós-login (rota autenticada — a landing pública fica em app/page.tsx).
// É daqui que qualquer ação principal do dia a dia começa: por isso "Novo
// agendamento" fica a 1 clique, e completar um agendamento a partir daqui
// não deve passar de 3 (serviço → horário → confirmar).
export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar businessName="Barbearia Central" />

      <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800">
          <div className="lg:hidden flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal-500" />
            <span className="font-display text-xl tracking-wide">PING</span>
          </div>
          <p className="hidden lg:block text-sm text-paper-500">
            Terça-feira, 17 de julho
          </p>
          <Link
            href="/cliente"
            className="w-9 h-9 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center text-xs font-semibold"
          >
            BC
          </Link>
        </header>

        <main className="flex-1 px-5 lg:px-10 py-8 max-w-6xl w-full mx-auto">
          {/* Métricas do dia — o "visão geral" que dá nome ao Dashboard */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <MetricCard
              label="Faturamento hoje"
              value={`R$ ${todayRevenue(MOCK_TRANSACTIONS).toLocaleString("pt-BR")}`}
              change="+18% vs. ontem"
            />
            <MetricCard
              label="Clientes ativos"
              value={String(activeClientsCount(MOCK_CLIENTS))}
              change="+3 esta semana"
            />
            <MetricCard
              label="Taxa de retorno"
              value={`${returnRate(MOCK_CLIENTS)}%`}
              change="+5% no mês"
            />
            <MetricCard
              label="Pontos resgatados"
              value="12"
              change="hoje"
              tone="neutral"
            />
          </section>

          {/* Hero — a headline é a tese do produto: agendar é tão simples
              quanto avisar alguém que você chegou. */}
          <section className="ping-card relative overflow-hidden p-8 lg:p-12 mb-10 animate-rise">
            <div className="absolute -right-6 -top-6 opacity-70">
              <PingMark size={180} />
            </div>
            <div className="relative max-w-lg">
              <p className="text-signal-500 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Barbearia Central está pronta
              </p>
              <h1 className="font-display text-6xl lg:text-7xl leading-[0.95] tracking-wide mb-4">
                Dá um<br />PING aí
              </h1>
              <p className="text-paper-400 mb-8 max-w-sm">
                Agende em três toques, faça check-in com QR Code e deixe a
                fidelidade rodar sozinha.
              </p>
              <Link
                href="/agenda?novo=1"
                className="inline-flex items-center gap-2 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold px-6 py-3.5 rounded-sm transition-colors"
              >
                Novo agendamento
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>

          {/* Grade de módulos — navegação funcional para cada área do produto */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-semibold text-paper-400 uppercase tracking-wide">
                Sua operação
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ModuleCard
                href="/agenda"
                label="Agenda"
                description="Horários e profissionais"
                icon={CalendarDays}
                metric="12"
              />
              <ModuleCard
                href="/checkin"
                label="Check-in"
                description="Escanear QR do cliente"
                icon={ScanLine}
              />
              <ModuleCard
                href="/servicos"
                label="Serviços"
                description="Catálogo e combos"
                icon={Scissors}
              />
              <ModuleCard
                href="/fidelidade"
                label="Fidelidade"
                description="Pontos e resgates"
                icon={Gift}
              />
              <ModuleCard
                href="/rh"
                label="Equipe"
                description="Profissionais e comissões"
                icon={Users}
              />
              <ModuleCard
                href="/financeiro"
                label="Financeiro"
                description="Caixa e PIX"
                icon={Wallet}
                metric="R$ 2.140"
              />
              <ModuleCard
                href="/campanhas"
                label="Campanhas"
                description="Mensagens com IA"
                icon={Megaphone}
              />
            </div>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
