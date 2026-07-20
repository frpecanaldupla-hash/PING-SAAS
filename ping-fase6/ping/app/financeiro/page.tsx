import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// Substitui a narrativa fixa pelas transações reais. Nascem em dois
// lugares: completeAppointment (agenda/actions.ts, receita + comissão) e
// redeemReward (fidelidade/actions.ts, despesa) — sem "concluir
// agendamento" na Agenda, essa tabela fica vazia pra sempre.
export default async function FinanceiroPage() {
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

  const startOfMonth = new Date(new Date().setDate(1)).toISOString();

  const { data: rows } = await supabase
    .from("transactions")
    .select("id, amount, method, type, created_at")
    .eq("business_id", business.id)
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  const transactions = rows ?? [];
  const receita = transactions.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
  const saidas = transactions.filter((t) => t.type !== "receita").reduce((s, t) => s + Number(t.amount), 0);

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
        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-1">Este mês</p>
          <p className="font-display text-4xl">{currency(receita - saidas)}</p>
          <p className="text-xs text-paper-500 mt-1">{currency(saidas)} em despesas e comissões</p>
        </div>

        <div className="ping-card p-6">
  <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">Receita por forma de pagamento</p>
  {receita === 0 ? (
    <p className="text-sm text-paper-500">Nenhuma receita registrada ainda este mês.</p>
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
                <div
                  className="h-full bg-signal-500 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  )}
</div>

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">Lançamentos do mês</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-paper-500 text-center py-6">
              Nenhum lançamento ainda. Conclua um agendamento na Agenda pra começar.
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
