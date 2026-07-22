import { CampaignSender } from "@/components/campanhas/CampaignSender";
import { CampaignList } from "@/components/campanhas/CampaignList";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import type { Campaign, Client, FidelityConfig } from "@/lib/types";

export default async function CampanhasPage() {
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

  const [{ data: clientRows }, { data: configRow }, { data: campaignRows }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, business_id, name, phone, birthday, points, total_visits, last_visit_at, qr_token, created_at, blocked_at")
      .eq("business_id", business.id),
    supabase
      .from("fidelity_configs")
      .select("points_per_real, points_per_visit, reward_threshold, reward_value")
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, business_id, name, message, audience, status, scheduled_at, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const clients: Client[] = (clientRows ?? []).map((c) => ({
    id: c.id,
    businessId: c.business_id,
    name: c.name,
    phone: c.phone,
    birthday: c.birthday,
    points: c.points,
    totalVisits: c.total_visits,
    lastVisitAt: c.last_visit_at,
    qrToken: c.qr_token,
    createdAt: c.created_at,
    blockedAt: c.blocked_at,
  }));

  const fidelityConfig: FidelityConfig = {
    businessId: business.id,
    pointsPerReal: Number(configRow?.points_per_real ?? 1),
    pointsPerVisit: configRow?.points_per_visit ?? 10,
    rewardThreshold: configRow?.reward_threshold ?? 500,
    rewardValue: Number(configRow?.reward_value ?? 50),
  };

  const campaigns: Campaign[] = (campaignRows ?? []).map((c) => ({
    id: c.id,
    businessId: c.business_id,
    name: c.name,
    message: c.message,
    audience: c.audience,
    status: c.status,
    scheduledAt: c.scheduled_at,
    createdAt: c.created_at,
  }));

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Campanhas" subtitle={business.name} />

        <main className="px-5 lg:px-10 py-8 max-w-3xl mx-auto space-y-8">
          <CampaignSender clients={clients} fidelityConfig={fidelityConfig} businessName={business.name} />

          <div>
            <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
              Histórico
            </p>
            <CampaignList campaigns={campaigns} />
          </div>
        </main>
      </div>
    </div>
  );
}
