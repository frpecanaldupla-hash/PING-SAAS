import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { PLANS, type PlanId } from "@/lib/billing/plans";

// Access token de TESTE em desenvolvimento/preview, de produção só quando o
// projeto for promovido — nunca commitado, sempre variável de ambiente (ver
// MERCADO_PAGO_ACCESS_TOKEN no Vercel/​.env.local). Regra de ouro: essa é a
// ÚNICA credencial de pagamento que o PING guarda — nenhum dado de cartão
// passa por aqui, o client só fala com o Mercado Pago pra criar a assinatura
// e pegar o link do checkout hospedado por eles.
function getClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

// frequency/frequency_type seguem o ciclo de cobrança de cada plano —
// trimestral e anual não são "assinaturas mensais com desconto", são
// cobradas de uma vez a cada 3/12 meses (ver lib/billing/plans.ts).
export async function createSubscriptionPreference(input: {
  planId: PlanId;
  businessId: string;
  businessName: string;
  payerEmail: string;
  backUrl: string;
}) {
  const plan = PLANS[input.planId];
  const preapproval = new PreApproval(getClient());

  // payer_email é obrigatório na API (apesar do SDK marcar como opcional) —
  // confirmado em teste real: omitir o campo dá 400 "payer_email is
  // required". Em teste, se houver um email de conta de teste configurado
  // (MERCADO_PAGO_TEST_PAYER_EMAIL), usa ele; senão cai no email real do
  // dono do PING mesmo — não é isso que causa a recusa do cartão de teste.
  const isTestMode = process.env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith("TEST-");
  const payerEmail =
    (isTestMode && process.env.MERCADO_PAGO_TEST_PAYER_EMAIL) || input.payerEmail;

  // `status` de propósito OMITIDO: sem card_token_id (nosso caso — cartão
  // nunca passa pelo PING), é isso que faz o Mercado Pago devolver um
  // init_point de checkout hospedado em vez de tentar autorizar direto.
  const result = await preapproval.create({
    body: {
      reason: `PING — plano ${plan.label} (${input.businessName})`,
      external_reference: input.businessId,
      payer_email: payerEmail,
      back_url: input.backUrl,
      auto_recurring: {
        frequency: plan.billingCycleMonths,
        frequency_type: "months",
        transaction_amount: plan.billingPrice,
        currency_id: "BRL",
      },
    },
  });

  return {
    preapprovalId: result.id,
    initPoint: result.init_point,
  };
}

// Chamado pelo webhook: nunca confia só no corpo da notificação (qualquer
// um pode mandar um POST parecido) — busca o estado real na API do Mercado
// Pago usando o id que veio na notificação, e só age em cima disso.
export async function fetchPreapproval(preapprovalId: string) {
  const preapproval = new PreApproval(getClient());
  return preapproval.get({ id: preapprovalId });
}
