import { FidelityManager } from "@/components/fidelidade/FidelityManager";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

// Substitui o placeholder "em construção" pelo cartão de carimbo real:
// `fidelity_configs` já é criada automaticamente com o negócio (ver
// create_business_and_owner) e o check-in já soma 1 carimbo por visita
// sozinho (ver app/checkin/actions.ts) — esta tela só precisava existir
// pra configurar a regra e resgatar o prêmio.
export default async function FidelidadePage() {
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

  const [{ data: config }, { data: clientRows }] = await Promise.all([
    supabase
      .from("fidelity_configs")
      .select("reward_threshold, reward_value")
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("id, name, points, total_visits")
      .eq("business_id", business.id)
      .order("points", { ascending: false })
      .limit(30),
  ]);

  const clients = (clientRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    points: c.points,
    totalVisits: c.total_visits,
  }));

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
      <PageHeader title="Fidelidade" subtitle={business.name} />

      <main className="px-5 lg:px-10 py-8 max-w-3xl mx-auto">
        <FidelityManager
          visitsRequired={config?.reward_threshold ?? 10}
          rewardValue={config?.reward_value ?? 40}
          initialClients={clients}
        />
      </main>
      </div>
    </div>
  );
}
