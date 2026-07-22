import { headers } from "next/headers";
import { ReferralShareCard } from "@/components/indicacoes/ReferralShareCard";
import { ReferralList, type ReferralRow } from "@/components/indicacoes/ReferralList";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

export default async function IndicacoesPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);

  if (!business) {
    return (
      <div className="relative min-h-screen bg-ink-950 text-paper-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Atmosphere />
        <p className="relative z-10 text-paper-500 text-sm">
          Não encontramos seu negócio. Tente entrar de novo.
        </p>
        <ButtonLink href="/login" variant="outline" className="relative z-10">
          Ir para o login
        </ButtonLink>
      </div>
    );
  }

  const [{ data: businessRow }, { data: referralRows }] = await Promise.all([
    supabase.from("businesses").select("referral_code").eq("id", business.id).maybeSingle(),
    supabase
      .from("referrals")
      .select("id, referred_business_id, converted_at, created_at")
      .eq("referrer_business_id", business.id)
      .order("created_at", { ascending: false }),
  ]);

  // Join feito em código, não embutido na query: RLS de `businesses` só
  // libera ler o negócio indicado através da policy nova de
  // migration 0015_referrals.sql, e duas FKs de `referrals` pra `businesses`
  // deixariam o embed ambíguo pro PostgREST sem um hint de relação — mais
  // simples resolver os nomes numa segunda query, igual outras telas do
  // app já fazem quando o embed não é direto (ver app/cliente/page.tsx).
  const referredIds = (referralRows ?? []).map((r) => r.referred_business_id);
  const { data: referredBusinesses } =
    referredIds.length > 0
      ? await supabase.from("businesses").select("id, name").in("id", referredIds)
      : { data: [] as { id: string; name: string }[] };

  const nameById = new Map((referredBusinesses ?? []).map((b) => [b.id, b.name]));

  const referrals: ReferralRow[] = (referralRows ?? []).map((r) => ({
    id: r.id,
    businessName: nameById.get(r.referred_business_id) ?? "Negócio",
    convertedAt: r.converted_at,
    createdAt: r.created_at,
  }));

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const referralLink = `${protocol}://${host}/cadastro?ref=${businessRow?.referral_code ?? ""}`;

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Indicações" subtitle={business.name} />

        <main className="px-5 lg:px-10 py-8 max-w-2xl mx-auto space-y-6">
          <ReferralShareCard link={referralLink} businessName={business.name} />
          <ReferralList referrals={referrals} />
        </main>
      </div>
    </div>
  );
}
