import { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// Clique duplo ou duas abas chamando check-in quase ao mesmo tempo pro mesmo
// cliente não podem virar 2 créditos — a janela é curta de propósito (só
// cobre corrida de clique/rede, não bloqueia uma visita de verdade horas
// depois).
const DUPLICATE_WINDOW_MS = 15_000;

// Única fonte de crédito de pontos/visita do PING — chamado só pelo check-in
// (app/checkin/actions.ts), nunca mais por completeAppointment (Agenda):
// concluir um corte sem check-in não gera ponto, de propósito, pra reforçar
// o uso do check-in.
//
// A trava contra duplicidade é o UPDATE ... WHERE abaixo, não uma leitura
// prévia: duas chamadas concorrentes pro mesmo cliente disputam a mesma
// linha no Postgres — a segunda só roda depois que a primeira commitar, e
// nesse ponto `last_visit_at` já está recente demais pra bater no WHERE.
// Ela recebe 0 linhas afetadas e sabe que foi duplicada, sem nunca duas
// escritas conseguirem se intercalar.
export async function creditVisit(
  supabase: SupabaseServer,
  businessId: string,
  client: { id: string; points: number; total_visits: number }
) {
  const { data: config } = await supabase
    .from("fidelity_configs")
    .select("points_per_visit")
    .eq("business_id", businessId)
    .maybeSingle();

  const pointsAdded = config?.points_per_visit ?? 10;
  const newPoints = client.points + pointsAdded;
  const newVisits = client.total_visits + 1;
  const nowISO = new Date().toISOString();
  const cutoffISO = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();

  const { data: updated, error } = await supabase
    .from("clients")
    .update({ points: newPoints, total_visits: newVisits, last_visit_at: nowISO })
    .eq("id", client.id)
    .or(`last_visit_at.is.null,last_visit_at.lt.${cutoffISO}`)
    .select("points, total_visits")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível creditar a visita.", duplicate: false, newPoints: client.points, pointsAdded: 0 };
  }

  if (!updated) {
    // 0 linhas afetadas: já creditado há menos de DUPLICATE_WINDOW_MS —
    // trata como sucesso silencioso (o check-in "funcionou", só não soma
    // pontos de novo) em vez de mostrar erro por um clique duplo do usuário.
    return { error: null, duplicate: true, newPoints: client.points, pointsAdded: 0 };
  }

  return { error: null, duplicate: false, newPoints: updated.points, pointsAdded };
}
