import Link from "next/link";
import {
  CalendarDays, ScanLine, Scissors,
  Gift, Users, Wallet, Megaphone, ArrowRight,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ModuleCard } from "@/components/shared/ModuleCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { PingMark } from "@/components/shared/PingMark";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { todayRevenue, activeClientsCount, returnRate, pointsRedeemedToday } from "@/lib/dashboard/metrics";
import { brasiliaDayRangeISO, todayLabelBrasilia } from "@/lib/time/brasilia";
import type { Client, Transaction } from "@/lib/types";

// O dashboard só busca os campos que as métricas precisam (não o registro
// completo de Client/Transaction) — ver lib/dashboard/metrics.ts.
type ClientMetric = Pick<Client, "totalVisits">;
type TransactionMetric = Pick<Transaction, "amount" | "type" | "kind">;

// Hub pós-login. Antes mostrava "Barbearia Central" e métricas fixas pra
// qualquer conta — agora busca o negócio de quem está logado e mostra os
// números reais dele (que começam em zero, o que é correto: uma conta nova
// não tem faturamento nem cliente nenhum ainda).
export default async function DashboardPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  const businessName = business?.name ?? "Seu negócio";
  const initials = businessName.slice(0, 2).toUpperCase();

  const today = todayLabelBrasilia();
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  let clients: ClientMetric[] = [];
  let transactions: TransactionMetric[] = [];

  if (business) {
    const [{ data: clientRows }, { data: txRows }] = await Promise.all([
      supabase.from("clients").select("total_visits").eq("business_id", business.id),
      supabase
        .from("transactions")
        .select("amount, type, kind, created_at")
        .eq("business_id", business.id)
        .gte("created_at", brasiliaDayRangeISO().startOfToday),
    ]);

    clients = (clientRows ?? []).map((c) => ({ totalVisits: c.total_visits }));
    transactions = (txRows ?? []).map((t) => ({ amount: t.amount, type: t.type, kind: t.kind }));
  }

  const revenue = todayRevenue(transactions);
  const active = activeClientsCount(clients);
  const rate = returnRate(clients);
  const redeemed = pointsRedeemedToday(transactions);
  const isEmpty = clients.length === 0 && transactions.length === 0;

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar businessName={businessName} />

        <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800/80">
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal-400 shadow-[0_0_10px_3px_rgba(255,91,61,0.7)]" />
            <span className="font-display text-xl tracking-wide">PING</span>
          </Link>
          <p className="hidden lg:block text-sm text-paper-500">{todayCapitalized}</p>
          <Link
            href="/cliente"
            className="w-9 h-9 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center text-xs font-semibold transition-colors hover:border-signal-400/50"
          >
            {initials}
          </Link>
        </header>

        <main className="flex-1 px-5 lg:px-10 py-8 max-w-6xl w-full mx-auto">
          {/* Métricas do dia — reais, não fixas. Uma conta nova começa em
              zero, e é isso que deve aparecer. */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-rise">
            <MetricCard
              label="Faturamento hoje"
              value={`R$ ${revenue.toLocaleString("pt-BR")}`}
              change={revenue > 0 ? "hoje" : "ainda sem vendas"}
              tone={revenue > 0 ? undefined : "neutral"}
            />
            <MetricCard
              label="Clientes ativos"
              value={String(active)}
              change={active > 0 ? "com visita recente" : "cadastre o primeiro"}
              tone={active > 0 ? undefined : "neutral"}
            />
            <MetricCard
              label="Taxa de retorno"
              value={`${rate}%`}
              change={clients.length > 0 ? "no mês" : "sem histórico ainda"}
              tone="neutral"
            />
            <MetricCard
              label="Pontos resgatados"
              value={String(redeemed)}
              change={redeemed > 0 ? "hoje" : "nenhum ainda"}
              tone="neutral"
            />
          </section>

          {/* Hero — a tese do produto continua a mesma, mas o nome do
              negócio agora é o de verdade. */}
          <section className="mb-10 animate-rise" style={{ animationDelay: "0.08s" }}>
            <Card className="overflow-hidden">
              <div className="p-8 lg:p-12">
                <div className="absolute -right-6 -top-6 opacity-70">
                  <PingMark size={180} />
                </div>
                <div className="relative max-w-lg">
                  <p className="text-signal-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                    {businessName} está pronta
                  </p>
                  <h1 className="font-display text-6xl lg:text-7xl leading-[0.95] tracking-wide mb-4">
                    Dá um<br />PING aí
                  </h1>
                  <p className="text-paper-400 mb-8 max-w-sm">
                    {isEmpty
                      ? "Comece configurando seu cardápio de serviços — a agenda e o check-in dependem dele."
                      : "Agende em três toques, faça check-in com QR Code e deixe a fidelidade rodar sozinha."}
                  </p>
                  <ButtonLink href={isEmpty ? "/servicos" : "/agenda?novo=1"} size="lg">
                    {isEmpty ? "Configurar cardápio" : "Novo agendamento"}
                    <ArrowRight size={18} />
                  </ButtonLink>
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-rise" style={{ animationDelay: "0.16s" }}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-semibold text-paper-400 uppercase tracking-wide">
                Sua operação
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ModuleCard href="/agenda" label="Agenda" description="Horários e profissionais" icon={CalendarDays} />
              <ModuleCard href="/checkin" label="Check-in" description="Escanear QR do cliente" icon={ScanLine} />
              <ModuleCard href="/servicos" label="Serviços" description="Catálogo e combos" icon={Scissors} />
              <ModuleCard href="/fidelidade" label="Fidelidade" description="Pontos e resgates" icon={Gift} />
              <ModuleCard href="/rh" label="Equipe" description="Profissionais e comissões" icon={Users} />
              <ModuleCard href="/financeiro" label="Financeiro" description="Caixa e PIX" icon={Wallet} />
              <ModuleCard href="/campanhas" label="Campanhas" description="Mensagens com IA" icon={Megaphone} />
            </div>
          </section>
        </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
