import { TeamManager } from "@/components/rh/TeamManager";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { brasiliaDayRangeISO } from "@/lib/time/brasilia";
import type { Appointment, Professional, ProfessionalTimeOff } from "@/lib/types";

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

  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO();

  const [{ data: profRows }, { data: apptRows }, { data: timeOffRows }] = await Promise.all([
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
    supabase
      .from("professional_time_off")
      .select("id, business_id, professional_id, kind, weekday, date, start_time, end_time, label, created_at")
      .eq("business_id", business.id),
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
    notes: null,
    createdAt: a.created_at,
  }));

  // slice(0,5): a coluna `time` do Postgres volta como "HH:MM:SS" — os
  // <input type="time"> do editor de bloqueios trabalham com "HH:MM".
  const timeOff: ProfessionalTimeOff[] = (timeOffRows ?? []).map((t) => ({
    id: t.id,
    businessId: t.business_id,
    professionalId: t.professional_id,
    kind: t.kind,
    weekday: t.weekday,
    date: t.date,
    startTime: t.start_time ? t.start_time.slice(0, 5) : null,
    endTime: t.end_time ? t.end_time.slice(0, 5) : null,
    label: t.label,
    createdAt: t.created_at,
  }));

  return (
    <AppShell businessName={business.name}>
        <PageHeader title="Equipe" subtitle={business.name} />

        <main className="px-5 lg:px-10 py-8 max-w-5xl mx-auto">
          <TeamManager professionals={professionals} appointments={appointments} timeOff={timeOff} />
        </main>
    </AppShell>
  );
}
