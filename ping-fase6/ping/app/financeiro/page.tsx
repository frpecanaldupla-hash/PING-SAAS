import Link from "next/link";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { periodRange, PERIOD_LABEL, type PeriodKey } from "@/lib/financeiro/period";
import { GoalEditor } from "@/components/financeiro/GoalEditor";

const PERIODS: PeriodKey[] = ["hoje", "semana", "mes", "ano"];

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period: PeriodKey = PERIODS.includes(rawPeriod as PeriodKey) ? (rawPeriod as PeriodKey) : "mes";

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);

  if (!business) {
    return (
      <div className="min-h-screen bg-ink-950 text-paper-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-paper-500 text-sm">Não encontramos seu negócio. Tente entrar de novo.</p>
        <Link href="/login" className="text-signal-500 text-sm font-semibold">Ir para o login</Link>
      </div>
    );
  }

  const { current, previous } = periodRange(period);

  const [{ data: rows }, { data: previousRows }, { data: goalRow }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, method, type, created_at")
      .eq("business_id", business.id)
      .gte("created_at", current.start.toISOString())
      .lte("created_at", current.end.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount, type")
      .eq("business_id", business.id)
      .gte("created_at", previous.start.toISOString())
      .lte("created_at", previous.end.toISOString()),
    supabase
      .from("revenue_goals")
      .select("monthly_target")
      .eq("business_id", business.id)
      .maybeSingle(),
  ]);

  const transactions = rows ?? [];
  const receita = transactions.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
  const saidas = transactions.filter((t) => t.type !== "receita").reduce((s, t) => s + Number(t.amount), 0);

  const receitaAnterior = (previousRows ?? [])
    .filter((t) => t.type === "receita")
    .reduce((s, t) => s + Number(t.amount), 0);

  const variacao = receitaAnterior > 0
    ? Math.round(((receita - receitaAnterior) / receitaAnterior) * 100)
    : receita > 0 ? 100 : 0;

  const byMethod: Record<string, number> = { pix: 0, cartao: 0, dinheiro: 0 };
  transactions.filter((t) => t.type === "receita").forEach((t) => { byMethod[t.method] += Number(t.amount); });

  const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const labelType: Record<string, string> = { receita: "Receita", despesa: "Despesa", comissao: "Comissão" };
  const labelMethod: Record<string, string> = { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" };

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Financeiro</h1>
          <p className="text-xs text-paper-500 mt-1">{business.name}</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/financeiro?period=${p}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                period === p
                  ? "bg-signal-500 border-signal-500 text-ink-950"
                  : "border-ink-700 text-paper-400 hover:text-paper-50"
              }`}
            >
              {PERIOD_LABEL[p]}
            </Link>
          ))}
          
            <a
              href={`/api/financeiro/export?period=${period}`}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-paper-400 hover:text-paper-50 border border-ink-700 rounded-full px-3 py-1.5 transition-colors"
          >
            <Download size={13} /> Baixar CSV
          </a>
        </div>

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-1">{PERIOD_LABEL[period]}</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="font-display text-4xl">{currency(receita - saidas)}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${variacao >= 0 ? "text-signal-500" : "text-danger"}`}>
              {variacao >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {variacao >= 0 ? "+" : ""}{variacao}% vs. período anterior
            </span>
          </div>
          <p className="text-xs text-paper-500 mt-1">{currency(saidas)} em despesas e comissões</p>
        </div>

        {period === "mes" && (
          <GoalEditor currentGoal={Number(goalRow?.monthly_target ?? 0)} currentRevenue={receita} />
        )}

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">Receita por forma de pagamento</p>
          {receita === 0 ? (
            <p className="text-sm text-paper-500">Nenhuma receita registrada nesse período.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byMethod)
                .sort(([, a], [, b]) => b - a)
                .map(([method, value]) => {
                  const percent = receita > 0 ? Math.round((value / receita) * 100) : 0;
                  return (
                    <div key={method}>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-sm font-medium">{labelMethod[method]}</p>
                        <p className="text-xs text-paper-500">
                          {currency(value)} <span className="text-paper-500">· {percent}%</span>
                        </p>
                      </div>
                      <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
                        <div className="h-full bg-signal-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">Lançamentos · {PERIOD_LABEL[period]}</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-paper-500 text-center py-6">
              Nenhum lançamento nesse período. Conclua um agendamento na Agenda pra começar.
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between border-b border-ink-800 pb-2">
                  <div>
                    <p className="text-sm font-medium">{labelType[t.type]}</p>
                    <p className="text-[11px] text-paper-500">
                      {labelMethod[t.method]} · {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "receita" ? "text-signal-500" : "text-danger"}`}>
                    {t.type === "receita" ? "+" : "-"} {currency(Number(t.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
