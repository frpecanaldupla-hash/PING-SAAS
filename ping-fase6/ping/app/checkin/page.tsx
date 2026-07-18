import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckinScanner } from "@/components/checkin/CheckinScanner";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// Substitui MOCK_CLIENTS / MOCK_FIDELITY_CONFIG pelo negócio de quem está
// logado. A lista inicial mostra os últimos clientes que visitaram — mais
// provável de ser quem está parado no balcão agora — e a busca ao vivo
// (ver CheckinScanner) cobre o resto.
export default async function CheckinPage() {
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

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, points")
    .eq("business_id", business.id)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Check-in</h1>
          <p className="text-xs text-paper-500 mt-1">{business.name}</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-4xl mx-auto">
        <CheckinScanner initialClients={clientRows ?? []} />
      </main>
    </div>
  );
}
