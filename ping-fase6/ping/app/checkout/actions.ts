"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { createSubscriptionPreference } from "@/lib/billing/mercadoPago";
import type { PlanId } from "@/lib/billing/plans";

// `provider_subscription_id`/`plan` gravados aqui pelo service role, não
// pelo client autenticado — de propósito não existe policy de escrita em
// `subscriptions` pra usuário comum (ver migration 0016). Quem de fato
// decide `status = 'ativo'` é sempre o webhook, nunca esta action.
export async function startCheckout(planId: PlanId) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado.", initPoint: null };

  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email;
  if (!email) return { error: "Sessão inválida. Entre novamente.", initPoint: null };

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const backUrl = `${protocol}://${host}/dashboard`;

  let initPoint: string | undefined;
  let preapprovalId: string | undefined;

  try {
    const result = await createSubscriptionPreference({
      planId,
      businessId: business.id,
      businessName: business.name,
      payerEmail: email,
      backUrl,
    });
    initPoint = result.initPoint;
    preapprovalId = result.preapprovalId;
  } catch (err) {
    console.error("Falha ao criar preapproval no Mercado Pago:", err);
    return { error: "Não foi possível conectar ao Mercado Pago. Tente novamente.", initPoint: null };
  }

  if (!initPoint) {
    return { error: "Não foi possível iniciar o checkout. Tente novamente.", initPoint: null };
  }

  const serviceRole = createServiceRoleClient();
  await serviceRole
    .from("subscriptions")
    .update({
      plan: planId,
      provider: "mercado_pago",
      provider_subscription_id: preapprovalId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", business.id);

  return { error: null, initPoint };
}
