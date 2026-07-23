"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getSessionClientId } from "@/lib/client-portal/session";
import { getSubscriptionGate, SUBSCRIPTION_EXPIRED_MESSAGE } from "@/lib/billing/subscriptionGate";
import { brasiliaDayRangeISO, parseDateOnlyISO } from "@/lib/time/brasilia";
import type { Appointment } from "@/lib/types";

type DayAppointment = Pick<Appointment, "professionalId" | "status" | "startAt" | "endAt">;

// Mesma ideia de getDayAppointments em app/agenda/actions.ts, mas pro
// contexto da Área do Cliente: não existe sessão do Supabase Auth aqui (ver
// lib/client-portal/session.ts), então o negócio vem do próprio cadastro do
// cliente, via service role — nunca via getCurrentBusiness.
export async function getAvailability(date: string) {
  const clientId = await getSessionClientId();
  if (!clientId) return { professionalIds: [] as string[], appointments: [] as DayAppointment[] };

  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("clients")
    .select("business_id")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return { professionalIds: [] as string[], appointments: [] as DayAppointment[] };

  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO(parseDateOnlyISO(date));

  const [{ data: profRows }, { data: apptRows }] = await Promise.all([
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

  const appointments: DayAppointment[] = (apptRows ?? []).map((a) => ({
    professionalId: a.professional_id,
    status: a.status,
    startAt: a.start_at,
    endAt: a.end_at,
  }));

  return {
    professionalIds: (profRows ?? []).map((p) => p.id as string),
    appointments,
  };
}

// client_id vem SEMPRE da sessão (getSessionClientId), nunca de um parâmetro
// do formulário — mesma regra de segurança de app/checkin/actions.ts: o
// cliente não pode controlar de fora qual client_id está sendo usado, senão
// um cliente logado poderia agendar (e ver histórico) em nome de outro.
export async function createMyAppointment(input: {
  professionalId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  notes?: string;
}) {
  const clientId = await getSessionClientId();
  if (!clientId) return { error: "Sua sessão expirou. Entre novamente." };

  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_id, blocked_at")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return { error: "Cadastro não encontrado." };

  // Cliente bloqueado (ver migration 0014_client_blocked.sql) não cria
  // agendamento novo por aqui — a equipe continua podendo agendar por ele
  // manualmente pela Agenda (createAppointment, sem essa checagem).
  if (client.blocked_at) {
    return {
      error: "Sua conta está temporariamente impedida de criar novos agendamentos. Fale com a barbearia.",
    };
  }

  const gate = await getSubscriptionGate(supabase, client.business_id);
  if (gate.isReadOnly) return { error: SUBSCRIPTION_EXPIRED_MESSAGE };

  const { data: service } = await supabase
    .from("services")
    .select("id, price")
    .eq("id", input.serviceId)
    .eq("business_id", client.business_id)
    .eq("active", true)
    .maybeSingle();

  if (!service) return { error: "Serviço não encontrado." };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", input.professionalId)
    .eq("business_id", client.business_id)
    .eq("active", true)
    .maybeSingle();

  if (!professional) return { error: "Profissional não encontrado." };

  // Mesma trava de conflito de horário de createAppointment (equipe, ver
  // app/agenda/actions.ts) — um cliente não pode marcar em cima de um
  // horário que acabou de ser ocupado.
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", client.business_id)
    .eq("professional_id", input.professionalId)
    .neq("status", "cancelled")
    .lt("start_at", input.endAt)
    .gt("end_at", input.startAt);

  if (conflicts && conflicts.length > 0) {
    return { error: "Esse horário acabou de ser ocupado. Escolha outro." };
  }

  const { error } = await supabase.from("appointments").insert({
    business_id: client.business_id,
    client_id: client.id,
    professional_id: input.professionalId,
    service_ids: [service.id],
    start_at: input.startAt,
    end_at: input.endAt,
    status: "scheduled",
    total_price: service.price,
    notes: input.notes?.trim() || null,
  });

  if (error) return { error: "Não foi possível agendar. Tente de novo." };

  revalidatePath("/cliente");
  revalidatePath("/agenda");
  return { error: null };
}
