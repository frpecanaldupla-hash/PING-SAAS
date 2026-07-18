import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RevenueByMethodChart } from "@/components/shared/RevenueByMethodChart";
import { MOCK_TRANSACTIONS } from "@/lib/mock/data";

const TYPE_LABEL = {
  receita: "Receita",
  despesa: "Despesa",
  comissao: "Comissão",
} as const;

const METHOD_LABEL = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
} as const;

// TODO(fase seguinte): conciliação automática via webhook do provedor PIX
// (hoje o lançamento é manual/derivado do agendamento concluído).
export default function FinanceiroPage() {
  const revenue = MOCK_TRANSACTIONS
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = MOCK_TRANSACTIONS
    .filter((t) => t.type === "despesa" || t.type === "comissao")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Financeiro</h1>
          <p className="text-xs text-paper-500 mt-1">Barbearia Central</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-4xl mx-auto space-y-6">
        <div className="ping-card p-8">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-xs uppercase tracking-wide text-paper-500">Este mês</p>
            <span className="text-[11px] bg-signal-500/15 text-signal-500 px-2.5 py-1 rounded-full">
              PIX integrado
            </span>
          </div>
          <p className="font-display text-6xl tracking-wide mt-2">
            R$ {revenue.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-paper-500 mt-2">
            R$ {expenses.toLocaleString("pt-BR")} em despesas e comissões
          </p>
        </div>

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
            Receita por forma de pagamento
          </p>
          <RevenueByMethodChart transactions={MOCK_TRANSACTIONS} />
        </div>

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
            Lançamentos de hoje
          </p>
          <div className="space-y-2">
            {MOCK_TRANSACTIONS.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-sm border border-ink-700"
              >
                <div>
                  <p className="text-sm font-medium">{TYPE_LABEL[t.type]}</p>
                  <p className="text-xs text-paper-500">{METHOD_LABEL[t.method]}</p>
                </div>
                <p
                  className={`ping-figure text-sm font-semibold ${
                    t.type === "receita" ? "text-signal-500" : "text-paper-400"
                  }`}
                >
                  {t.type === "receita" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
