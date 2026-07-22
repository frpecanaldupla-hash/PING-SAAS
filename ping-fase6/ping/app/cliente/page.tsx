import { redirect } from "next/navigation";
import { Accessibility, Baby, Calendar, Car, Clock, LogOut, MapPin, Navigation, Wifi } from "lucide-react";
import { ClientQr } from "@/components/cliente/ClientQr";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fidelityProgress } from "@/lib/fidelity/points";
import { getSessionClientId } from "@/lib/client-portal/session";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logoutClient } from "@/app/cliente/actions";

// Substitui MOCK_CLIENTS[0] pelo cliente de verdade da sessão (ver
// lib/client-portal/session.ts) — essa é a Área do Cliente com login
// próprio, separada do login da equipe em /login.
//
// Duas coisas de propósito NÃO estão numa única query com embed
// aninhado:
// 1. `clients` não tem coluna `notes` — pedir esse campo faz o Supabase
//    recusar a query inteira (e a página inteira cai pro fallback de
//    "cliente não encontrado", te jogando de volta pro login).
// 2. `appointments` não tem uma foreign key pra `services` — o vínculo é
//    `service_ids uuid[]`, uma lista solta de ids. O Supabase só consegue
//    "embutir" (`tabela ( campos )`) relações de chave estrangeira de
//    verdade; tentar `appointments ( services (name) )` também derruba a
//    query inteira do mesmo jeito. Por isso services vem numa consulta
//    separada, e o nome de cada serviço é casado no código (igual já é
//    feito em app/checkin e no app/agenda).
export default async function ClientePage() {
  const clientId = await getSessionClientId();
  if (!clientId) redirect("/cliente/entrar");

  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, name, qr_token, points, business_id, blocked_at, businesses ( name, address, maps_url, has_wifi, has_kids_area, has_parking, has_accessibility )"
    )
    .eq("id", clientId)
    .maybeSingle();

  if (!client) redirect("/cliente/entrar");

  const business = Array.isArray(client.businesses) ? client.businesses[0] : client.businesses;
  const businessProfile = business as {
    name?: string;
    address?: string | null;
    maps_url?: string | null;
    has_wifi?: boolean;
    has_kids_area?: boolean;
    has_parking?: boolean;
    has_accessibility?: boolean;
  } | null;
  const businessName = businessProfile?.name ?? "PING";

  const amenities = [
    { label: "Wi-Fi", icon: Wifi, enabled: businessProfile?.has_wifi ?? false },
    { label: "Kids", icon: Baby, enabled: businessProfile?.has_kids_area ?? false },
    { label: "Estacionamento", icon: Car, enabled: businessProfile?.has_parking ?? false },
    { label: "Acessível", icon: Accessibility, enabled: businessProfile?.has_accessibility ?? false },
  ].filter((a) => a.enabled);

  const hasProfileInfo = Boolean(businessProfile?.address || businessProfile?.maps_url) || amenities.length > 0;

  const [{ data: configRow }, { data: apptRows }, { data: serviceRows }] = await Promise.all([
    supabase
      .from("fidelity_configs")
      .select("points_per_real, points_per_visit, reward_threshold, reward_value")
      .eq("business_id", client.business_id)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, service_ids, start_at, status, total_price, notes")
      .eq("client_id", clientId)
      .order("start_at", { ascending: false }),
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
  const appointments = apptRows ?? [];
  const serviceNamesFor = (ids: string[]) =>
    services.filter((s) => ids.includes(s.id)).map((s) => s.name).join(" + ") || "Serviço";

  const upcoming = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const lastVisits = appointments.filter((a) => a.status === "completed").slice(0, 5);

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
      <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800/80">
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
        <Card className="p-8 text-center animate-rise">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">Seu QR Code</p>
          <ClientQr token={client.qr_token} />
          <p className="font-semibold mt-5 text-lg">{client.name}</p>
          <p className="text-xs text-paper-500 mt-1">
            Mostre este QR na barbearia para fazer check-in rápido
          </p>
        </Card>

        <Card tone="gold" className="p-6 animate-rise">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-paper-500">Fidelidade</p>
            <p className="ping-figure text-2xl font-semibold text-brass-400">
              {client.points} pts
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink-800 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-brass-500 to-brass-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-paper-500">
            {canRedeem
              ? `Você já pode resgatar R$ ${fidelityConfig.rewardValue.toFixed(0)} de desconto!`
              : `Faltam ${remaining} pontos para R$ ${fidelityConfig.rewardValue.toFixed(0)} de desconto`}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4 flex items-center gap-2">
            <Calendar size={14} /> Próximos agendamentos
          </p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-paper-500 text-center py-6">
              Nenhum agendamento por enquanto
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="px-3 py-2.5 rounded-sm border border-ink-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{serviceNamesFor(a.service_ids)}</span>
                    <span className="ping-figure text-xs text-paper-400">
                      {new Date(a.start_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {a.notes && (
                    <p className="text-xs text-paper-500 mt-1.5">&ldquo;{a.notes}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4 flex items-center gap-2">
            <Clock size={14} /> Últimos cortes
          </p>
          {lastVisits.length === 0 ? (
            <p className="text-sm text-paper-500 text-center py-6">
              Ainda não tem cortes registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {lastVisits.map((a) => (
                <div key={a.id} className="flex justify-between items-center py-2 border-b border-ink-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{serviceNamesFor(a.service_ids)}</p>
                    <p className="text-xs text-paper-500">
                      {new Date(a.start_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="ping-figure text-sm font-semibold text-brass-400">
                    R$ {Number(a.total_price ?? 0).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {hasProfileInfo && (
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-paper-500 mb-4 flex items-center gap-2">
              <MapPin size={14} /> Sobre {businessName}
            </p>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {amenities.map((a) => (
                  <span
                    key={a.label}
                    className="inline-flex items-center gap-1.5 text-xs text-paper-400 bg-ink-800 border border-ink-700 rounded-full px-3 py-1.5"
                  >
                    <a.icon size={13} className="text-brass-400" /> {a.label}
                  </span>
                ))}
              </div>
            )}

            {businessProfile?.address && (
              <p className="text-sm text-paper-400 mb-4">{businessProfile.address}</p>
            )}

            {businessProfile?.maps_url && (
              <a
                href={businessProfile.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-signal-400 hover:text-signal-300 font-semibold transition-colors"
              >
                <Navigation size={15} /> Como chegar
              </a>
            )}
          </Card>
        )}

        {client.blocked_at ? (
          <p className="text-center text-sm text-paper-500 border border-ink-800 rounded-sm px-4 py-3.5">
            Sua conta está temporariamente impedida de criar novos agendamentos. Fale com{" "}
            {businessName}.
          </p>
        ) : (
          <ButtonLink href="/cliente/agendar" size="lg" className="w-full">
            Agendar novo horário
          </ButtonLink>
        )}
      </main>
      </div>
    </div>
  );
}
