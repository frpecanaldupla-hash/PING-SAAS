"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// Adiciona um profissional "sem login próprio" — mesma lógica que já vale
// pra Lucas/Thiago no mock: entram na Agenda pra receber horários e no
// cálculo de comissão, mas quem opera o sistema continua sendo o dono
// logado. Convite por e-mail (pra esse profissional logar sozinho) é uma
// decisão maior, separada, ainda não implementada.
export async function addProfessional(name: string, commissionPercent: number | null) {
  const cleanName = name.trim();
  if (!cleanName) return { error: "Digite um nome." };

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      business_id: business.id,
      name: cleanName,
      role: "professional",
      active: true,
      commission_percent: commissionPercent,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível adicionar o profissional." };
  }

  revalidatePath("/rh");
  revalidatePath("/agenda");
  return { error: null, id: data.id as string };
}

// Um único update pra nome, comissão e status — os três campos editáveis do
// cartão da Equipe. Cada chamada manda só o que mudou.
export async function updateProfessional(
  id: string,
  fields: { name?: string; commissionPercent?: number | null; active?: boolean }
) {
  const update: Record<string, unknown> = {};

  if (fields.name !== undefined) {
    const clean = fields.name.trim();
    if (!clean) return { error: "Digite um nome." };
    update.name = clean;
  }
  if (fields.commissionPercent !== undefined) {
    update.commission_percent = fields.commissionPercent;
  }
  if (fields.active !== undefined) {
    update.active = fields.active;
  }

  if (Object.keys(update).length === 0) {
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("professionals").update(update).eq("id", id);

  if (error) {
    return { error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/rh");
  revalidatePath("/agenda");
  return { error: null };
}

// Folga/bloqueio de horário de um profissional (ver migration
// 0012_professional_time_off.sql) — soma da lista de horários oferecidos
// tanto no BookingDrawer (equipe) quanto no ClientBookingFlow (cliente), via
// isSlotBlocked em lib/agenda/time.ts. As mesmas regras de consistência do
// CHECK constraint da tabela são validadas aqui antes de tentar o insert,
// pra devolver uma mensagem legível em vez do erro cru do Postgres.
export async function addProfessionalTimeOff(
  professionalId: string,
  input: {
    kind: "recurring" | "date";
    weekday: number | null;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    label: string | null;
  }
) {
  if (input.kind === "recurring" && input.weekday === null) {
    return { error: "Escolha o dia da semana." };
  }
  if (input.kind === "date" && !input.date) {
    return { error: "Escolha uma data." };
  }
  if ((input.startTime && !input.endTime) || (!input.startTime && input.endTime)) {
    return { error: "Preencha os dois horários, ou deixe os dois em branco pro dia inteiro." };
  }
  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    return { error: "O horário de início precisa ser antes do de fim." };
  }

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { data, error } = await supabase
    .from("professional_time_off")
    .insert({
      business_id: business.id,
      professional_id: professionalId,
      kind: input.kind,
      weekday: input.kind === "recurring" ? input.weekday : null,
      date: input.kind === "date" ? input.date : null,
      start_time: input.startTime,
      end_time: input.endTime,
      label: input.label,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível salvar o bloqueio." };

  revalidatePath("/rh");
  revalidatePath("/agenda");
  revalidatePath("/cliente/agendar");
  return { error: null, id: data.id as string };
}

export async function deleteProfessionalTimeOff(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("professional_time_off").delete().eq("id", id);

  if (error) return { error: "Não foi possível remover o bloqueio." };

  revalidatePath("/rh");
  revalidatePath("/agenda");
  revalidatePath("/cliente/agendar");
  return { error: null };
}
