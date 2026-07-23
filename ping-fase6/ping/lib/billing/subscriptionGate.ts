import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export type SubscriptionGate = {
  isReadOnly: boolean;
  isInternal: boolean;
  status: string | null;
};

const EXPIRED_MESSAGE =
  "Seu período de teste acabou. Assine um plano para continuar cadastrando e agendando.";

// Sem cron: a checagem roda "de carona" em cada resolução do negócio (ver
// getCurrentBusiness). Sempre calcula isReadOnly comparando a data na hora —
// a gravação de status = 'vencido' abaixo é só uma otimização (evita repetir
// esse cálculo em toda request seguinte), nunca a fonte da verdade. Se a
// escrita falhar (ex.: RLS, rede), o gate continua correto mesmo assim.
export async function getSubscriptionGate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  businessId: string
): Promise<SubscriptionGate> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, is_internal_account, trial_ends_at")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!subscription) return { isReadOnly: false, isInternal: false, status: null };
  if (subscription.is_internal_account) {
    return { isReadOnly: false, isInternal: true, status: subscription.status };
  }

  if (subscription.status !== "trial") {
    return {
      isReadOnly: subscription.status === "vencido" || subscription.status === "cancelado",
      isInternal: false,
      status: subscription.status,
    };
  }

  const trialExpired = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at).getTime() < Date.now()
    : false;

  if (trialExpired) {
    // Best-effort: usuário comum não tem policy de escrita em `subscriptions`
    // (ver migration 0016), então essa gravação usa service role. Se falhar,
    // não importa — isReadOnly já foi computado acima a partir da data.
    const serviceRole = createServiceRoleClient();
    await serviceRole
      .from("subscriptions")
      .update({ status: "vencido", updated_at: new Date().toISOString() })
      .eq("business_id", businessId)
      .eq("status", "trial");

    return { isReadOnly: true, isInternal: false, status: "vencido" };
  }

  return { isReadOnly: false, isInternal: false, status: "trial" };
}

export const SUBSCRIPTION_EXPIRED_MESSAGE = EXPIRED_MESSAGE;
