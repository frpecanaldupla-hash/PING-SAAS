import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, LogOut } from "lucide-react";
import { ClientQr } from "@/components/cliente/ClientQr";
import { fidelityProgress } from "@/lib/fidelity/points";
import { getSessionClientId } from "@/lib/client-portal/session";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logoutClient } from "@/app/cliente/actions";

// Substitui MOCK_CLIENTS[0] pelo cliente de verdade da sessão (ver
// lib/client-portal/session.ts) — essa é a Área do Cliente com login
// próprio, separada do login da equipe em /login.
export default async function ClientePage() {
  const clientId = await getSessionClientId();
  if (!clientId) redirect("/cliente/entrar");

  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, qr_token, points, business_id, businesses ( name )")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) redirect("/cliente/entrar");

  const business = Array.isArray(client.businesses) ? client.businesses[0] : client.businesses;
  const businessName = (business as { name?: string } | null)?.name ?? "PING";

  const [{ data: configRow }, { data: apptRows }, { data: serviceRows }] = await Promise.all([
    supabase
      .from("fidelity_configs")
      .select("business_id, points_per_real, points_per_visit, reward_threshold, reward_value")
      .eq("business_id", client.business_id)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, service_ids, start_at")
      .eq("client_id", clientId)
      .eq("status", "scheduled")
      .order("start_at", { ascending: true }),
    supabase.from("services").select("id, name").eq("business_id", client.business_id),
  ]);

  const fidelityConfig = {
    businessId: client.business_id,
    pointsPerReal: Number(configRow?.points_per_real ?? 1),
    pointsPerVisit: configRow?.points_per_visit ?? 1,
    rewardThreshold: configRow?.reward_threshold ?? 10,
    rewardValue: Number(configRow?.reward_value ?? 40),
  };

  const { remaining, percent, canRedeem } = fidelityProgress(client.points, fidelityConfig);

  const services = serviceRows ?? [];
  const upcoming = apptRows ?? [];

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center justify-between gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Sua área</h1>
          <p className="text-xs text-paper-500 mt-1">{businessName}</p>
        </div>
        <form action={logoutClient}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-paper-500 hover:text-paper-50 transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </form>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-6">
        <div className="ping-card p-8 text-center">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">Seu QR Code</p>
          <ClientQr token={client.qr_token} />
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
              ? `Você já pode resgatar R$ ${fidelityConfig.rewardValue.toFixed(0)} de desconto!`
              : `Faltam ${remaining} pontos para R$ ${fidelityConfig.rewardValue.toFixed(0)} de desconto`}
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
              const serviceNames = services
                .filter((s) => a.service_ids.includes(s.id))
                .map((s) => s.name)
                .join(" + ");
              return (
                <div
                  key={a.id}
                  className="flex justify-between items-center px-3 py-2.5 rounded-sm border border-ink-700"
                >
                  <span className="text-sm">{serviceNames}</span>
                  <span className="ping-figure text-xs text-paper-400">
                    {new Date(a.start_at).toLocaleTimeString("pt-BR", {
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
