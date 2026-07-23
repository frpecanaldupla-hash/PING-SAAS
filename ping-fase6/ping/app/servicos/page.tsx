import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { ServicesManager } from "@/components/servicos/ServicesManager";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppShell } from "@/components/layout/AppShell";

// Substitui o placeholder "em construção" — este é o cardápio real do
// negócio logado, com o catálogo de partida (semeado em
// create_business_and_owner, ver supabase/migrations/0003) já editável:
// dá pra trocar preço, remover pré-cadastrados e adicionar cortes/combos
// novos, tudo salvo em `services`, isolado por business_id via RLS.
export default async function ServicosPage() {
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

  const { data: services } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, is_combo, active")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("is_combo", { ascending: true })
    .order("name", { ascending: true });

  return (
    <AppShell businessName={business.name}>
        <PageHeader title="Serviços" subtitle={`Cardápio de ${business.name}`} />

        <main className="px-5 lg:px-10 py-6 max-w-3xl mx-auto">
          <ServicesManager initialServices={services ?? []} />
        </main>
    </AppShell>
  );
}
