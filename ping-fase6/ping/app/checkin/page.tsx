import { CheckinScanner } from "@/components/checkin/CheckinScanner";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

// Substitui MOCK_CLIENTS / MOCK_FIDELITY_CONFIG pelo negócio de quem está
// logado. A lista inicial mostra os últimos clientes que visitaram — mais
// provável de ser quem está parado no balcão agora — e a busca ao vivo
// (ver CheckinScanner) cobre o resto.
export default async function CheckinPage() {
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

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, points")
    .eq("business_id", business.id)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .limit(20);

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Check-in" subtitle={business.name} />

        <main className="px-5 lg:px-10 py-8 max-w-4xl mx-auto">
          <CheckinScanner initialClients={clientRows ?? []} />
        </main>
      </div>
    </div>
  );
}
