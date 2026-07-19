"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { brasiliaDayRangeISO } from "@/lib/time/brasilia";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type CheckinClientRow = { id: string; name: string; points: number; total_visits: number };

// Núcleo do check-in, compartilhado pelos dois caminhos (busca manual e QR):
// soma pontos de fidelidade, soma visita, marca a última visita, e — de
// quebra — avança pra "checked_in" um agendamento de hoje que esse cliente
// já tivesse como "scheduled" (integra com a Agenda sem exigir nada do
// dono). Isso é só um bônus best-effort: falhar aqui não deve derrubar o
// check-in em si.
async function applyCheckin(supabase: SupabaseServer, businessId: string, client: CheckinClientRow) {
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

  if (error) {
    return { error: "Não foi possível registrar o check-in. Tente de novo." };
  }

  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO();
  await supabase
    .from("appointments")
    .update({ status: "checked_in" })
    .eq("business_id", businessId)
    .eq("client_id", client.id)
    .eq("status", "scheduled")
    .gte("start_at", startOfToday)
    .lt("start_at", startOfTomorrow);

  revalidatePath("/checkin");
  revalidatePath("/agenda");
  revalidatePath("/dashboard");

  return { error: null, name: client.name, points: newPoints, pointsAdded };
}

export async function checkinClient(clientId: string) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, points, total_visits")
    .eq("business_id", business.id)
    .eq("id", clientId)
    .maybeSingle();

  if (error || !client) return { error: "Cliente não encontrado." };

  return applyCheckin(supabase, business.id, client);
}

// Resolve o `qr_token` lido pela câmera (o mesmo valor codificado no QR da
// Área do Cliente, ver components/cliente/ClientQr.tsx) contra o cliente
// dono desse negócio, e credita o check-in.
export async function checkinByQrToken(token: string) {
  const cleanToken = token.trim();
  if (!cleanToken) return { error: "QR Code inválido." };

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, points, total_visits")
    .eq("business_id", business.id)
    .eq("qr_token", cleanToken)
    .maybeSingle();

  if (error || !client) {
    return { error: "Esse QR Code não pertence a nenhum cliente deste negócio." };
  }

  return applyCheckin(supabase, business.id, client);
}

// Busca pro painel de "ou busque pelo nome" — sem termo digitado, mostra
// os últimos que visitaram (mais provável de ser quem está no balcão agora).
export async function searchCheckinClients(query: string) {
  const q = query.trim();
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { clients: [] as { id: string; name: string; points: number }[] };

  const base = supabase.from("clients").select("id, name, points").eq("business_id", business.id);

  const { data } =
    q.length >= 2
      ? await base.ilike("name", `%${q}%`).limit(20)
      : await base.order("last_visit_at", { ascending: false, nullsFirst: false }).limit(20);

  return { clients: data ?? [] };
}
