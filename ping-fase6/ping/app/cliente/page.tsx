import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, LogOut, Clock } from "lucide-react";
import { ClientQr } from "@/components/cliente/ClientQr";
import { fidelityProgress } from "@/lib/fidelity/points";
import { getSessionClientId } from "@/lib/client-portal/session";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logoutClient } from "@/app/cliente/actions";

export default async function ClientePage() {
  const clientId = await getSessionClientId();

  if (!clientId) {
    redirect("/cliente/entrar");
  }

  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("clients")
    .select(`
      id, 
      name, 
      qr_token, 
      points, 
      notes,
      business_id,
      businesses ( name ),
      appointments (
        id, start_at, end_at, status, total_price,
        services ( name )
      )
    `)
    .eq("id", clientId)
    .single();

  if (!client) {
    redirect("/cliente/entrar");
  }

  const business = Array.isArray(client.businesses) ? client.businesses[0] : client.businesses;
  const businessName = (business as { name?: string } | null)?.name ?? "PING";

  const fidelityConfig = {
    businessId: client.business_id,
    pointsPerReal: 1,
    pointsPerVisit: 1,
    rewardThreshold: 10,
    rewardValue: 40,
  };

  const { remaining, percent, canRedeem } = fidelityProgress(client.points, fidelityConfig);

  const lastAppointments = client.appointments
    ?.filter((a: any) => a.status === "completed")
    .sort((a: any, b: any) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    .slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800">
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Sua Área</h1>
          <p className="text-xs text-paper-500 mt-1">{businessName}</p>
        </div>
        <form action={logoutClient}>
          <button className="flex items-center gap-1.5 text-xs text-paper-500 hover:text-paper-50 transition-colors">
            <LogOut size={14} /> Sair
          </button>
        </form>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-8">
        <div className="ping-card p-8 text-center">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">SEU QR CODE</p>
          <ClientQr token={client.qr_token} />
          <p className="font-semibold mt-5 text-lg">{client.name}</p>
          <p className="text-xs text-paper-500 mt-1">Mostre este QR na barbearia para fazer check-in rápido</p>
        </div>

        <div className="ping-card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs uppercase tracking-wide text-paper-500">FIDELIDADE</p>
            <p className="ping-figure text-3xl font-semibold text-brass-400">
              {client.points} pts
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink-800 overflow-hidden mb-3">
            <div className="h-full bg-brass-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-paper-500">
            {canRedeem 
              ? `🎉 Você pode resgatar R$ ${fidelityConfig.rewardValue} de desconto!` 
              : `Faltam ${remaining} pontos para R$ ${fidelityConfig.rewardValue} de desconto`}
          </p>
        </div>

        {client.notes && (
          <div className="ping-card p-6">
            <p className="text-xs uppercase tracking-wide text-paper-500 mb-2">Observações</p>
            <p className="text-sm italic">"{client.notes}"</p>
          </div>
        )}

        <div className="ping-card p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4 flex items-center gap-2">
            <Clock size={14} /> Últimos cortes
          </p>
          {lastAppointments.length === 0 ? (
            <p className="text-sm text-paper-500 text-center py-8">Ainda não tem cortes registrados.</p>
          ) : (
            <div className="space-y-4">
              {lastAppointments.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center py-2 border-b border-ink-700 last:border-0">
                  <div>
                    <p className="font-medium text-sm">
                      {a.services?.map((s: any) => s.name).join(" + ") || "Serviço"}
                    </p>
                    <p className="text-xs text-paper-500">
                      {new Date(a.start_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-brass-400 text-sm font-semibold">
                      R$ {a.total_price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/agenda?novo=1"
          className="block text-center py-4 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold rounded-sm transition-colors text-lg"
        >
          Agendar novo horário →
        </Link>
      </main>
    </div>
  );
}
