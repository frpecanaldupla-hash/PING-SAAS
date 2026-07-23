import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { BookingDrawer } from "@/components/agenda/BookingDrawer";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SUBSCRIPTION_EXPIRED_MESSAGE } from "@/lib/billing/subscriptionGate";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import {
  brasiliaDayRangeISO,
  dateOnlyLabel,
  formatDateOnlyISO,
  parseDateOnlyISO,
  todayDateOnly,
} from "@/lib/time/brasilia";
import type { Appointment, BusinessHours, Client, Professional, ProfessionalTimeOff, Service } from "@/lib/types";

// Substitui os MOCK_* pelo negócio de quem está logado. Uma conta nova
// começa com o dono como único profissional (criado em
// create_business_and_owner, ver supabase/migrations/0004) e nenhum
// agendamento ainda — o que é o estado correto, não um bug.
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; data?: string }>;
}) {
  const { novo, data } = await searchParams;

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

  // Sem ?data, mostra hoje (Brasília) — mesmo comportamento de antes. Com
  // ?data=YYYY-MM-DD, mostra o dia pedido (ver seletor em AgendaGrid).
  const selectedDate = data ? parseDateOnlyISO(data) : todayDateOnly();
  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO(selectedDate);
  const selectedDateISO = formatDateOnlyISO(selectedDate);
  const selectedDateLabel = dateOnlyLabel(selectedDate);

  const [
    { data: profRows },
    { data: serviceRows },
    { data: apptRows },
    { data: clientRows },
    { data: hoursRows },
    { data: timeOffRows },
  ] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, business_id, user_id, name, avatar_url, role, active, commission_percent")
      .eq("business_id", business.id)
      .eq("active", true),
    supabase
      .from("services")
      .select("id, business_id, name, price, duration_minutes, is_combo, combo_service_ids, active")
      .eq("business_id", business.id)
      .eq("active", true),
    supabase
      .from("appointments")
      .select("id, business_id, client_id, professional_id, service_ids, start_at, end_at, status, total_price, notes, created_at")
      .eq("business_id", business.id)
      .gte("start_at", startOfToday)
      .lt("start_at", startOfTomorrow),
    supabase
      .from("clients")
      .select("id, name")
      .eq("business_id", business.id),
    supabase
      .from("business_hours")
      .select("business_id, weekday, opens_at, closes_at, closed")
      .eq("business_id", business.id),
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

  const services: Service[] = (serviceRows ?? []).map((s) => ({
    id: s.id,
    businessId: s.business_id,
    name: s.name,
    price: Number(s.price),
    durationMinutes: s.duration_minutes,
    isCombo: s.is_combo,
    comboServiceIds: s.combo_service_ids,
    active: s.active,
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
    notes: a.notes,
    createdAt: a.created_at,
  }));

  const clients: Pick<Client, "id" | "name">[] = clientRows ?? [];

  const businessHours: BusinessHours[] = (hoursRows ?? []).map((h) => ({
    businessId: h.business_id,
    weekday: h.weekday,
    opensAt: h.opens_at,
    closesAt: h.closes_at,
    closed: h.closed,
  }));

  // slice(0,5): a coluna `time` do Postgres volta como "HH:MM:SS" — o tipo
  // ProfessionalTimeOff.startTime/endTime é "HH:MM" (ver lib/types).
  const professionalTimeOff: ProfessionalTimeOff[] = (timeOffRows ?? []).map((t) => ({
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

  // O PageHeader não capitaliza mais o subtítulo por CSS (deformaria nomes
  // de negócio) — a data, que começa minúscula, é capitalizada aqui.
  const dateLabel =
    selectedDateLabel.charAt(0).toUpperCase() + selectedDateLabel.slice(1);

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader
          title="Agenda"
          subtitle={`${dateLabel} · ${business.name}`}
          action={
            professionals.length > 0 ? (
              <BookingDrawer
                services={services}
                professionals={professionals}
                appointments={appointments}
                businessHours={businessHours}
                professionalTimeOff={professionalTimeOff}
                initialDate={selectedDateISO}
                autoOpen={novo === "1"}
                isReadOnly={business.isReadOnly}
              />
            ) : undefined
          }
        />

        <main className="px-5 lg:px-10 py-6 max-w-6xl mx-auto">
          {business.isReadOnly && (
            <Card tone="gold" className="p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-paper-100">{SUBSCRIPTION_EXPIRED_MESSAGE}</p>
              <ButtonLink href="/checkout">Assinar agora</ButtonLink>
            </Card>
          )}
          {professionals.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-paper-400 text-sm">
                Nenhum profissional ativo ainda. Isso não deveria acontecer numa
                conta recém-criada — se você está vendo isso, avisa a gente.
              </p>
            </Card>
          ) : (
            <AgendaGrid
              professionals={professionals}
              appointments={appointments}
              clients={clients}
              services={services}
              businessHours={businessHours}
              currentUserId={business.userId}
              selectedDate={selectedDateISO}
            />
          )}
        </main>
      </div>
    </div>
  );
}
