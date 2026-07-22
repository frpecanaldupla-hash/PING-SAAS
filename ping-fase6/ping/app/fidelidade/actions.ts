"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// `reward_threshold`/`reward_value` são os mesmos nomes de coluna de quando
// o modelo era pontos-por-dinheiro (ver 0001_init.sql) — reaproveitados
// aqui pro cartão de carimbo pra não precisar de migration nova. Na tela,
// chamamos de "carimbos necessários" e "valor do prêmio".
export async function updateFidelityConfig(fields: {
  visitsRequired?: number;
  rewardValue?: number;
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const update: Record<string, unknown> = {};
  if (fields.visitsRequired !== undefined) {
    if (fields.visitsRequired < 1) return { error: "Precisa ser pelo menos 1 visita." };
    update.reward_threshold = fields.visitsRequired;
  }
  if (fields.rewardValue !== undefined) {
    if (fields.rewardValue < 0) return { error: "Valor inválido." };
    update.reward_value = fields.rewardValue;
  }
  if (Object.keys(update).length === 0) return { error: null };

  const { error } = await supabase
    .from("fidelity_configs")
    .update(update)
    .eq("business_id", business.id);

  if (error) return { error: "Não foi possível salvar." };

  revalidatePath("/fidelidade");
  return { error: null };
}

export async function searchFidelityClients(query: string) {
  const q = query.trim();
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) {
    return {
      clients: [] as { id: string; name: string; points: number; totalVisits: number; blockedAt: string | null }[],
    };
  }

  const base = supabase
    .from("clients")
    .select("id, name, points, total_visits, blocked_at")
    .eq("business_id", business.id);

  const { data } =
    q.length >= 2
      ? await base.ilike("name", `%${q}%`).order("points", { ascending: false }).limit(30)
      : await base.order("points", { ascending: false }).limit(30);

  return {
    clients: (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      points: c.points,
      totalVisits: c.total_visits,
      blockedAt: c.blocked_at,
    })),
  };
}

// Bloqueia/desbloqueia um cliente — impede que ELE (não a equipe) crie
// novos agendamentos pela Área do Cliente (guarda em createMyAppointment,
// ver app/cliente/agendar/actions.ts). A equipe continua podendo agendar
// por ele manualmente pela Agenda, sem checagem nenhuma lá — ver migration
// 0014_client_blocked.sql. `.eq("business_id", ...)` impede um dono
// bloquear cliente de outro negócio adivinhando o id.
export async function setClientBlocked(clientId: string, blocked: boolean) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { error } = await supabase
    .from("clients")
    .update({ blocked_at: blocked ? new Date().toISOString() : null })
    .eq("id", clientId)
    .eq("business_id", business.id);

  if (error) return { error: "Não foi possível atualizar. Tente de novo." };

  revalidatePath("/fidelidade");
  return { error: null };
}

// Resgata o prêmio: desconta os carimbos usados COM rollover — se o
// cliente tinha mais carimbos que o necessário, o excedente continua
// valendo pro próximo prêmio, em vez de zerar tudo (mais justo). Registrar
// o custo do prêmio em `transactions` é best-effort — se falhar, o resgate
// em si já valeu, não desfaz o desconto de carimbos; o Financeiro (quando
// entrar) vai ler dessa mesma tabela.
export async function redeemReward(clientId: string) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const [{ data: client }, { data: config }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, points")
      .eq("business_id", business.id)
      .eq("id", clientId)
      .maybeSingle(),
    supabase
      .from("fidelity_configs")
      .select("reward_threshold, reward_value")
      .eq("business_id", business.id)
      .maybeSingle(),
  ]);

  if (!client) return { error: "Cliente não encontrado." };
  if (!config) return { error: "Configuração de fidelidade não encontrada." };

  if (client.points < config.reward_threshold) {
    return { error: "Esse cliente ainda não completou os carimbos necessários." };
  }

  const newPoints = client.points - config.reward_threshold;

  const { error } = await supabase
    .from("clients")
    .update({ points: newPoints })
    .eq("id", clientId);

  if (error) return { error: "Não foi possível resgatar. Tente de novo." };

  await supabase.from("transactions").insert({
    business_id: business.id,
    amount: config.reward_value,
    method: "dinheiro",
    type: "despesa",
    kind: "resgate",
  });

  revalidatePath("/fidelidade");
  revalidatePath("/financeiro");
  return { error: null, name: client.name as string, remainingPoints: newPoints };
}
