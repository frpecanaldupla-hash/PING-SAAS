import { redirect } from "next/navigation";
import { ClientBookingFlow } from "@/components/cliente/ClientBookingFlow";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSessionClientId } from "@/lib/client-portal/session";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { brasiliaDayRangeISO, todayDateOnly, formatDateOnlyISO } from "@/lib/time/brasilia";
import type { Service } from "@/lib/types";

// Agendamento próprio do cliente logado (login por PIN, ver
// lib/client-portal/session.ts) — não é o mesmo fluxo da equipe
// (BookingDrawer em /agenda), que espera uma sessão de staff e tem passo de
// busca/cadastro de OUTRO cliente. Aqui o client_id já é o da sessão; ver
// app/cliente/agendar/actions.ts.
export default async function AgendarPage() {
  const clientId = await getSessionClientId();
  if (!clientId) redirect("/cliente/entrar");

  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_id")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) redirect("/cliente/entrar");

  const todayISO = formatDateOnlyISO(todayDateOnly());
  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO();

  const [{ data: serviceRows }, { data: profRows }, { data: apptRows }] = await Promise.all([
    supabase
      .from("services")
      .select("id, business_id, name, price, duration_minutes, is_combo, combo_service_ids, active")
      .eq("business_id", client.business_id)
      .eq("active", true),
    supabase
      .from("professionals")
      .select("id")
      .eq("business_id", client.business_id)
      .eq("active", true),
    supabase
      .from("appointments")
      .select("professional_id, status, start_at, end_at")
      .eq("business_id", client.business_id)
      .gte("start_at", startOfToday)
      .lt("start_at", startOfTomorrow),
  ]);

  const services: Service[] = (serviceRows ?? []).map((s) => ({
    id: s.id,
    businessId: s.business_id,
    name: s.name,
    price: Number(s.price),
    durationMinutes: s.duration_minutes,
    isCombo: s.is_combo,
    comboServiceIds: s.combo_service_ids,
    active: s.active,
  }));

  const professionalIds = (profRows ?? []).map((p) => p.id as string);
  const initialAppointments = (apptRows ?? []).map((a) => ({
    professionalId: a.professional_id,
    status: a.status,
    startAt: a.start_at,
    endAt: a.end_at,
  }));

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Agendar" backHref="/cliente" />

        <main className="px-5 lg:px-10 py-8 max-w-md mx-auto">
          {services.length === 0 || professionalIds.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-paper-400 text-sm">
                Esse negócio ainda não tem serviços ou profissionais configurados.
                Volta mais tarde.
              </p>
            </Card>
          ) : (
            <ClientBookingFlow
              services={services}
              professionalIds={professionalIds}
              initialDate={todayISO}
              initialAppointments={initialAppointments}
            />
          )}
        </main>
      </div>
    </div>
  );
}
