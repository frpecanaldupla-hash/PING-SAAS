import { type NextRequest, NextResponse } from "next/server";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { fetchPreapproval } from "@/lib/billing/mercadoPago";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { creditReferralOnFirstPayment } from "@/lib/referrals/creditReferralOnFirstPayment";

// Recebe a confirmação de pagamento do Mercado Pago e atualiza o status da
// assinatura — o único lugar do PING que muda `subscriptions.status` pra
// 'ativo'. Duas camadas de segurança antes de confiar em qualquer coisa:
// 1. Valida a assinatura HMAC do header x-signature (usa o validador oficial
//    do SDK — não recalcula o manifest na mão, exatamente pra não arriscar
//    montar a string errada numa validação de segurança).
// 2. Mesmo depois de validado, NUNCA confia no corpo da notificação pra
//    decidir status — busca o estado real via fetchPreapproval, porque o
//    corpo de uma notificação é só um aviso "algo mudou", não a fonte da
//    verdade.
export async function POST(request: NextRequest) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    // Falha fechado: sem segredo configurado, não dá pra validar nada —
    // recusa em vez de aceitar sem verificar.
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id");

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    throw err;
  }

  const body = await request.json().catch(() => null);
  const topic = body?.type ?? url.searchParams.get("type");

  // Só o ciclo de vida da assinatura (preapproval) nos interessa aqui —
  // outros tópicos (payment avulso, merchant_order etc.) são confirmados
  // sem ação, pra o Mercado Pago não ficar reenviando.
  if (topic !== "subscription_preapproval" && topic !== "preapproval") {
    return NextResponse.json({ received: true });
  }

  if (!dataId) {
    return NextResponse.json({ error: "missing data.id" }, { status: 400 });
  }

  const preapproval = await fetchPreapproval(dataId);
  const businessId = preapproval.external_reference;
  if (!businessId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ received: true });
  }

  const nowISO = new Date().toISOString();

  if (preapproval.status === "authorized") {
    const wasTrial = subscription.status === "trial";
    const planId = subscription.plan as PlanId;
    const periodMonths = PLANS[planId]?.billingCycleMonths ?? 1;
    const currentPeriodEndsAt = new Date();
    currentPeriodEndsAt.setMonth(currentPeriodEndsAt.getMonth() + periodMonths);

    await supabase
      .from("subscriptions")
      .update({
        status: "ativo",
        provider: "mercado_pago",
        provider_subscription_id: dataId,
        current_period_ends_at: currentPeriodEndsAt.toISOString(),
        updated_at: nowISO,
      })
      .eq("business_id", businessId);

    // Só credita indicação na conversão do trial pra pago — se já estava
    // ativo, isso aqui é renovação, não conversão nova. Ainda assim,
    // creditReferralOnFirstPayment é idempotente por conta própria (ver
    // lib/referrals/), então uma entrega duplicada do webhook não credita
    // duas vezes de qualquer forma.
    if (wasTrial) {
      await creditReferralOnFirstPayment(businessId);
    }
  } else if (preapproval.status === "cancelled") {
    await supabase
      .from("subscriptions")
      .update({ status: "cancelado", updated_at: nowISO })
      .eq("business_id", businessId);
  } else if (preapproval.status === "paused") {
    await supabase
      .from("subscriptions")
      .update({ status: "vencido", updated_at: nowISO })
      .eq("business_id", businessId);
  }

  return NextResponse.json({ received: true });
}
