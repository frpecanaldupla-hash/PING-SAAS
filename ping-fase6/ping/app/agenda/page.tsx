import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { BookingDrawer } from "@/components/agenda/BookingDrawer";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import {
  brasiliaDayRangeISO,
  dateOnlyLabel,
  formatDateOnlyISO,
  parseDateOnlyISO,
  todayDateOnly,
} from "@/lib/time/brasilia";
import type { Appointment, Client, Professional, Service } from "@/lib/types";

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
  const { data: auth } = await supabase.auth.getUser();

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

  // Sem ?data, mostra hoje (Brasília) — mesmo comportamento de antes. Com
  // ?data=YYYY-MM-DD, mostra o dia pedido (ver seletor em AgendaGrid).
  const selectedDate = data ? parseDateOnlyISO(data) : todayDateOnly();
  const { startOfToday, startOfTomorrow } = brasiliaDayRangeISO(selectedDate);
  const selectedDateISO = formatDateOnlyISO(selectedDate);
  const selectedDateLabel = dateOnlyLabel(selectedDate);

  const [{ data: profRows }, { data: serviceRows }, { data: apptRows }, { data: clientRows }] =
    await Promise.all([
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

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center justify-between px-5 lg:px-10 py-5 border-b border-ink-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-3xl tracking-wide leading-none">Agenda</h1>
            <p className="text-xs text-paper-500 mt-1 capitalize">
              {selectedDateLabel} · {business.name}
            </p>
          </div>
        </div>
        {professionals.length > 0 && (
          <BookingDrawer
            services={services}
            professionals={professionals}
            appointments={appointments}
            initialDate={selectedDateISO}
            autoOpen={novo === "1"}
          />
        )}
      </header>

      <main className="px-5 lg:px-10 py-6 max-w-6xl mx-auto">
        {professionals.length === 0 ? (
          <div className="ping-card p-10 text-center">
            <p className="text-paper-400 text-sm">
              Nenhum profissional ativo ainda. Isso não deveria acontecer numa
              conta recém-criada — se você está vendo isso, avisa a gente.
            </p>
          </div>
        ) : (
          <AgendaGrid
            professionals={professionals}
            appointments={appointments}
            clients={clients}
            services={services}
            currentUserId={auth.user?.id}
            selectedDate={selectedDateISO}
          />
        )}
      </main>
    </div>
  );
}
