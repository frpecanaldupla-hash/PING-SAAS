import { CheckoutFlow } from "@/components/billing/CheckoutFlow";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import type { PlanId } from "@/lib/billing/plans";

export default async function CheckoutPage() {
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

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("business_id", business.id)
    .maybeSingle();

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Assinatura" subtitle={business.name} />

        <main className="px-5 lg:px-10 py-8 max-w-2xl mx-auto">
          <CheckoutFlow initialPlan={(subscription?.plan as PlanId) ?? "mensal"} />
        </main>
      </div>
    </div>
  );
}
