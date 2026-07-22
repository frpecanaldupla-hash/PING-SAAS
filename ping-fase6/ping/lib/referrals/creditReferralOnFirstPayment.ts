import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

// PLACEHOLDER — o PING ainda não tem billing implementado. Chame esta
// função no exato momento em que o pagamento da assinatura de
// `referredBusinessId` for confirmado PELA PRIMEIRA VEZ (webhook do gateway
// de pagamento, ou onde quer que a confirmação de cobrança seja resolvida).
// Hoje nenhum lugar do código chama isso — sem essa chamada, o mês grátis
// do indicador nunca é liberado, mesmo que o indicado pague normalmente.
//
// `converted_at` já preenchido é o sinal de "não credite de novo" — chamar
// isso mais de uma vez pro mesmo negócio é seguro (idempotente).
export async function creditReferralOnFirstPayment(referredBusinessId: string) {
  const supabase = createServiceRoleClient();

  const { data: referral } = await supabase
    .from("referrals")
    .select("id, converted_at")
    .eq("referred_business_id", referredBusinessId)
    .maybeSingle();

  if (!referral) return { error: null, credited: false as const };
  if (referral.converted_at) return { error: null, credited: false as const };

  const { error } = await supabase
    .from("referrals")
    .update({ converted_at: new Date().toISOString() })
    .eq("id", referral.id);

  if (error) return { error: "Não foi possível registrar a conversão da indicação.", credited: false as const };

  return { error: null, credited: true as const };
}
