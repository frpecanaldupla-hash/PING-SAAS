"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

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
