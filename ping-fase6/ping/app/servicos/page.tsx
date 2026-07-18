import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { ServicesManager } from "@/components/servicos/ServicesManager";

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
      <div className="min-h-screen bg-ink-950 text-paper-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-paper-500 text-sm">
          Não encontramos seu negócio. Tente entrar de novo.
        </p>
        <Link href="/login" className="text-signal-500 text-sm font-semibold">
          Ir para o login
        </Link>
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
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Serviços</h1>
          <p className="text-xs text-paper-500 mt-1">Cardápio de {business.name}</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-6 max-w-3xl mx-auto">
        <ServicesManager initialServices={services ?? []} />
      </main>
    </div>
  );
}
