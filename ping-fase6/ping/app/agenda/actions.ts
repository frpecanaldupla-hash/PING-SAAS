"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { assertClientLimitOk } from "@/lib/billing/limits";
import { brasiliaDayRangeISO, parseDateOnlyISO } from "@/lib/time/brasilia";
import type { Appointment } from "@/lib/types";

// Usado pelo BookingDrawer quando o dono troca o dia dentro do passo de
// horário — a Agenda (app/agenda/page.tsx) já busca os agendamentos do dia
// que está sendo VISUALIZADO, mas o drawer deixa escolher qualquer um dos
// próximos 14 dias pro novo agendamento, que pode ser diferente do dia
// aberto na tela. Sem essa busca própria, a pré-visualização de horários
// livres ficaria sempre baseada no dia errado.
export async function getDayAppointments(date: string) {
  type DayAppointment = Pick<Appointment, "professionalId" | "status" | "startAt" | "endAt">;

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { appointments: [] as DayAppointment[] };

  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO(parseDateOnlyISO(date));
  const { data } = await supabase
    .from("appointments")
    .select("professional_id, status, start_at, end_at")
    .eq("business_id", business.id)
    .gte("start_at", startOfToday)
    .lt("start_at", startOfTomorrow);

  const appointments: DayAppointment[] = (data ?? []).map((a) => ({
    professionalId: a.professional_id,
    status: a.status,
    startAt: a.start_at,
    endAt: a.end_at,
  }));

  return { appointments };
}

// Renomear usa a mesma policy de RLS "member full access" de professionals
// (ver supabase/migrations/0001_init.sql) — qualquer membro do negócio pode
// editar, sem precisar de nenhuma função nova no banco. Hoje só usamos isso
// pro próprio dono editar o próprio nome; quando a Equipe tiver mais gente,
// dá pra restringir no app quem vê o lápis em qual chip.
export async function renameProfessional(id: string, name: string) {
  const cleanName = name.trim();
  if (!cleanName) {
    return { error: "Digite um nome." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({ name: cleanName })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível salvar o nome. Tente de novo." };
  }

  revalidatePath("/agenda");
  return { error: null };
}

// Busca de cliente pro passo "3 de 4" do agendamento — nome ou telefone,
// isolado por negócio via RLS. Duas queries simples em vez de um único
// `.or()` porque montar esse filtro concatenando texto digitado pelo
// usuário é caminho fácil pra quebrar a query com caracteres especiais.
export async function searchClients(query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return { clients: [] as { id: string; name: string; phone: string }[] };
  }

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { clients: [] as { id: string; name: string; phone: string }[] };

  const digits = q.replace(/\D/g, "");

  const [{ data: byName }, { data: byPhone }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone")
      .eq("business_id", business.id)
      .ilike("name", `%${q}%`)
      .limit(6),
    digits.length >= 2
      ? supabase
          .from("clients")
          .select("id, name, phone")
          .eq("business_id", business.id)
          .ilike("phone", `%${digits}%`)
          .limit(6)
      : Promise.resolve({ data: [] as { id: string; name: string; phone: string }[] }),
  ]);

  const byId = new Map<string, { id: string; name: string; phone: string }>();
  [...(byName ?? []), ...(byPhone ?? [])].forEach((c) => byId.set(c.id, c));
  return { clients: Array.from(byId.values()).slice(0, 6) };
}

// Grava o agendamento de verdade. Recebe OU um clientId existente (achado
// na busca) OU os dados de um cliente novo — nesse segundo caso, acha ou
// cria o cliente e o agendamento na mesma chamada, pra nunca sobrar cliente
// órfão se o passo de agendamento falhar por outro motivo.
export async function createAppointment(input: {
  professionalId: string;
  serviceIds: string[];
  startAt: string;
  endAt: string;
  totalPrice: number;
  clientId?: string;
  newClient?: { name: string; phone: string };
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  let clientId = input.clientId;

  if (!clientId) {
    const name = input.newClient?.name.trim();
    const phoneDigits = (input.newClient?.phone ?? "").replace(/\D/g, "");

    if (!name || phoneDigits.length < 8) {
      return { error: "Escolha um cliente ou preencha nome e telefone." };
    }

    // `clients` tem unique (business_id, phone) — ver 0001_init.sql. Busca
    // antes de tentar criar pra não duplicar cliente que já existe.
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", business.id)
      .eq("phone", phoneDigits)
      .maybeSingle();

    if (existing) {
      clientId = existing.id;
    } else {
      const limit = await assertClientLimitOk(supabase, business.id);
      if (!limit.ok) return { error: limit.error };

      const { data: created, error: clientError } = await supabase
        .from("clients")
        .insert({ business_id: business.id, name, phone: phoneDigits })
        .select("id")
        .single();

      if (clientError || !created) {
        return { error: "Não foi possível cadastrar o cliente." };
      }
      clientId = created.id;
    }
  }

  // Trava contra dois agendamentos sobrepostos pro mesmo profissional — sem
  // isso, nada impedia duas pessoas de marcar o mesmo horário (o
  // BookingDrawer só esconde os horários ocupados como ajuda visual; quem
  // garante de verdade é essa checagem aqui, do lado do servidor).
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", business.id)
    .eq("professional_id", input.professionalId)
    .neq("status", "cancelled")
    .lt("start_at", input.endAt)
    .gt("end_at", input.startAt);

  if (conflicts && conflicts.length > 0) {
    return { error: "Esse horário acabou de ser ocupado com esse profissional. Escolha outro." };
  }

  const { error: apptError } = await supabase.from("appointments").insert({
    business_id: business.id,
    client_id: clientId,
    professional_id: input.professionalId,
    service_ids: input.serviceIds,
    start_at: input.startAt,
    end_at: input.endAt,
    status: "scheduled",
    total_price: input.totalPrice,
  });

  if (apptError) {
    return { error: "Não foi possível salvar o agendamento. Tente de novo." };
  }

  revalidatePath("/agenda");
  return { error: null };
}

// Move um agendamento existente pra outro horário e/ou outro profissional —
// usado pelo drag-and-drop da Agenda. Reaproveita a mesma checagem de
// conflito de createAppointment, só excluindo o próprio agendamento da
// comparação (senão ele sempre "colidiria com si mesmo"). A duração
// original é preservada: quem chama manda o novo startAt/endAt já com a
// duração do serviço aplicada (ver AgendaGrid.tsx).
export async function moveAppointment(input: {
  id: string;
  professionalId: string;
  startAt: string;
  endAt: string;
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", business.id)
    .eq("professional_id", input.professionalId)
    .neq("id", input.id)
    .neq("status", "cancelled")
    .lt("start_at", input.endAt)
    .gt("end_at", input.startAt);

  if (conflicts && conflicts.length > 0) {
    return { error: "Esse horário já está ocupado com esse profissional." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      professional_id: input.professionalId,
      start_at: input.startAt,
      end_at: input.endAt,
    })
    .eq("id", input.id)
    .eq("business_id", business.id);

  if (error) {
    return { error: "Não foi possível mover o agendamento. Tente de novo." };
  }

  revalidatePath("/agenda");
  return { error: null };
}
// Concluir é o que efetivamente gera dinheiro no sistema: sem isso, nenhuma
// transação nasce e o Financeiro fica pra sempre vazio, não importa quantas
// telas existam em cima dele. Além da receita, se o profissional tiver
// commission_percent configurado, já lança a comissão dele automaticamente
// — dois lançamentos, uma ação só.
export async function completeAppointment(
  appointmentId: string,
  amount: number,
  method: "pix" | "cartao" | "dinheiro"
) {
  if (!amount || amount <= 0) return { error: "Informe um valor válido." };

  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, business_id, professional_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) return { error: "Agendamento não encontrado." };

  // Concluir aqui NÃO credita pontos de fidelidade — só o check-in faz isso
  // (ver lib/checkin/creditVisit.ts). Antes, completar sem check-in prévio
  // também creditava, e a trava contra duplicidade só olhava um lado (se já
  // tinha check-in, não creditava de novo); completar ANTES do check-in não
  // tinha proteção nenhuma do lado do check-in, e o cliente acabava
  // ganhando 2 pontos. Fonte única de verdade agora: só quem passa pelo
  // check-in (QR, busca manual, ou o botão da Agenda) ganha ponto — de
  // propósito, pra reforçar o uso do check-in.
  //
  // As duas operações abaixo não dependem uma da outra (só do agendamento já
  // buscado) — rodavam em série antes, cada uma pagando seu próprio
  // round-trip ao Postgres.
  const [{ error: updateError }, { data: professional }] = await Promise.all([
    supabase
      .from("appointments")
      .update({ status: "completed", total_price: amount })
      .eq("id", appointmentId),
    supabase
      .from("professionals")
      .select("commission_percent")
      .eq("id", appointment.professional_id)
      .maybeSingle(),
  ]);

  if (updateError) return { error: "Não foi possível concluir o agendamento." };

  const transactionRows: {
    business_id: string;
    appointment_id: string;
    professional_id: string;
    amount: number;
    method: "pix" | "cartao" | "dinheiro";
    type: "receita" | "comissao";
  }[] = [
    {
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      professional_id: appointment.professional_id,
      amount,
      method,
      type: "receita",
    },
  ];

  if (professional?.commission_percent) {
    const commissionAmount = Number(
      (amount * (professional.commission_percent / 100)).toFixed(2)
    );
    transactionRows.push({
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      professional_id: appointment.professional_id,
      amount: commissionAmount,
      method,
      type: "comissao",
    });
  }

  await supabase.from("transactions").insert(transactionRows);

  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  revalidatePath("/checkin");
  revalidatePath("/fidelidade");
  revalidatePath("/dashboard");
  return { error: null };
}
