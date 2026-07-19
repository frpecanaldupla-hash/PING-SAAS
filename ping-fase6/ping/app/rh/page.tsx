import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeamManager } from "@/components/rh/TeamManager";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { brasiliaDayRangeISO } from "@/lib/time/brasilia";
import type { Appointment, Professional } from "@/lib/types";

// Substitui MOCK_PROFESSIONALS / MOCK_APPOINTMENTS pelo negócio de quem
// está logado. Ao contrário da Agenda (que só busca profissionais ativos,
// já que é pra escolher quem vai atender), aqui buscamos TODOS — inclusive
// os desativados, porque a própria função da tela é gerenciar quem está
// ativo ou não.
export default async function RhPage() {
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

  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO();

  const [{ data: profRows }, { data: apptRows }] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, business_id, user_id, name, avatar_url, role, active, commission_percent")
      .eq("business_id", business.id),
    supabase
      .from("appointments")
      .select("id, business_id, client_id, professional_id, service_ids, start_at, end_at, status, total_price, created_at")
      .eq("business_id", business.id)
      .eq("status", "completed")
      .gte("start_at", startOfToday)
      .lt("start_at", startOfTomorrow),
  ]);

  const professionals: Professional[] = (profRows ?? []).map((p) => ({
    id: p.id,
    businessId: p.business_id,
    userId: p.user_id,
    name: p.name,
    avatarUrl: p.avatar_url,
    role: p.role,
    active: p.active,
    commissionPercent: p.commission_percent,
  }));

  const appointments: Appointment[] = (apptRows ?? []).map((a) => ({
    id: a.id,
    businessId: a.business_id,
    clientId: a.client_id,
    professionalId: a.professional_id,
    serviceIds: a.service_ids,
    startAt: a.start_at,
    endAt: a.end_at,
    status: a.status,
    totalPrice: Number(a.total_price),
    createdAt: a.created_at,
  }));

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Equipe</h1>
          <p className="text-xs text-paper-500 mt-1">{business.name}</p>
        </div>
      </header>

      <main className="px-5 lg:px-10 py-8 max-w-5xl mx-auto">
        <TeamManager professionals={professionals} appointments={appointments} />
      </main>
    </div>
  );
}
