import { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// Núcleo do check-in (soma pontos de fidelidade + visita), compartilhado
// entre app/checkin/actions.ts (busca manual e QR) e completeAppointment em
// app/agenda/actions.ts — concluir o pagamento na Agenda direto, sem passar
// pela tela de Check-in, também precisa contar como visita pro cliente.
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

  const { error } = await supabase
    .from("clients")
    .update({
      points: newPoints,
      total_visits: newVisits,
      last_visit_at: new Date().toISOString(),
    })
    .eq("id", client.id);

  return { error, newPoints, pointsAdded };
}
