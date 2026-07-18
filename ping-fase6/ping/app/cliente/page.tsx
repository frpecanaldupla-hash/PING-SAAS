import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { ClientQr } from "@/components/cliente/ClientQr";
import { fidelityProgress } from "@/lib/fidelity/points";
import {
  MOCK_CLIENTS, MOCK_FIDELITY_CONFIG, MOCK_APPOINTMENTS, MOCK_SERVICES,
} from "@/lib/mock/data";

// TODO(fase seguinte): trocar MOCK_CLIENTS[0] pelo cliente autenticado via
// Supabase Auth (a mesma sessão validada em middleware.ts) — a Área do
// Cliente é uma rota separada de login, não o dashboard interno da equipe.
export default function ClientePage() {
  const client = MOCK_CLIENTS[0];
  const { remaining, percent, canRedeem } = fidelityProgress(client.points, MOCK_FIDELITY_CONFIG);
  const upcoming = MOCK_APPOINTMENTS.filter(
    (a) => a.clientId === client.id && a.status === "scheduled"
  );

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Sua área</h1>
          <p className="text-xs text-paper-500 mt-1">Barbearia Central</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-6">
        <div className="ping-card p-8 text-center">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
            Seu QR Code
          </p>
          <ClientQr token={client.qrToken} />
          <p className="font-semibold mt-5">{client.name}</p>
        </div>

        <div className="ping-card p-6">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-paper-500">Fidelidade</p>
            <p className="ping-figure text-2xl font-semibold text-brass-400">
              {client.points} pts
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink-800 overflow-hidden mb-2">
            <div
              className="h-full bg-brass-500 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-paper-500">
            {canRedeem
              ? `Você já pode resgatar R$ ${MOCK_FIDELITY_CONFIG.rewardValue.toFixed(0)} de desconto!`
              : `Faltam ${remaining} pontos para R$ ${MOCK_FIDELITY_CONFIG.rewardValue.toFixed(0)} de desconto`}
          </p>
        </div>

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4 flex items-center gap-2">
            <Calendar size={14} /> Próximos agendamentos
          </p>
          {upcoming.length === 0 && (
            <p className="text-sm text-paper-500 text-center py-6">
              Nenhum agendamento por enquanto
            </p>
          )}
          <div className="space-y-3">
            {upcoming.map((a) => {
              const serviceNames = MOCK_SERVICES.filter((s) =>
                a.serviceIds.includes(s.id)
              )
                .map((s) => s.name)
                .join(" + ");
              return (
                <div
                  key={a.id}
                  className="flex justify-between items-center px-3 py-2.5 rounded-sm border border-ink-700"
                >
                  <span className="text-sm">{serviceNames}</span>
                  <span className="ping-figure text-xs text-paper-400">
                    {new Date(a.startAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Link
          href="/agenda?novo=1"
          className="block text-center py-3.5 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold rounded-sm transition-colors"
        >
          Agendar novo horário
        </Link>
      </main>
    </div>
  );
}
