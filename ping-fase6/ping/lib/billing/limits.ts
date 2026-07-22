import type { SupabaseClient } from "@supabase/supabase-js";

// Só durante o trial — quem já paga (ou é conta interna) não tem limite.
// Chamado nos 2 pontos reais que inserem em `clients` hoje:
// registerClientForBusiness (app/b/[slug]/actions.ts) e o passo de "cliente
// novo" dentro de createAppointment (app/agenda/actions.ts). Nunca chamado
// pra reaproveitar um telefone já cadastrado — só antes de criar linha nova.
const TRIAL_CLIENT_LIMIT = 20;

export async function assertClientLimitOk(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  businessId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, is_internal_account")
    .eq("business_id", businessId)
    .maybeSingle();

  if (subscription?.is_internal_account) return { ok: true };
  if (subscription?.status !== "trial") return { ok: true };

  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if ((count ?? 0) >= TRIAL_CLIENT_LIMIT) {
    return {
      ok: false,
      error: `Seu período de teste permite até ${TRIAL_CLIENT_LIMIT} clientes cadastrados. Assine um plano para continuar cadastrando.`,
    };
  }

  return { ok: true };
}
