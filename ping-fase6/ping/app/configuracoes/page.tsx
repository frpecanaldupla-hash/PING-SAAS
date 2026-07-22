import { headers } from "next/headers";
import { BusinessProfileForm } from "@/components/configuracoes/BusinessProfileForm";
import { BusinessHoursForm, type HoursRow } from "@/components/configuracoes/BusinessHoursForm";
import { ShareLinkCard } from "@/components/configuracoes/ShareLinkCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

// Configurações do negócio — link/QR público (Fase 5), horário de
// funcionamento (Fase 3) e perfil público: amenidades + localização
// (Fase 2).
export default async function ConfiguracoesPage() {
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

  const [{ data: profile }, { data: hoursRows }] = await Promise.all([
    supabase
      .from("businesses")
      .select("address, maps_url, has_wifi, has_kids_area, has_parking, has_accessibility")
      .eq("id", business.id)
      .maybeSingle(),
    supabase
      .from("business_hours")
      .select("weekday, opens_at, closes_at, closed")
      .eq("business_id", business.id),
  ]);

  // slice(0,5): a coluna `time` do Postgres volta como "HH:MM:SS" — o
  // <input type="time"> do formulário trabalha com "HH:MM".
  const hoursRowsFormatted: HoursRow[] = (hoursRows ?? []).map((h) => ({
    weekday: h.weekday,
    opensAt: h.opens_at.slice(0, 5),
    closesAt: h.closes_at.slice(0, 5),
    closed: h.closed,
  }));

  // Origem calculada a partir do host da requisição (não window.location,
  // que não existe no servidor) — reflete o domínio real que o dono está
  // usando, custom domain ou o padrão da Vercel, sem precisar de env var
  // nova. x-forwarded-proto cobre o caso comum de estar atrás de um proxy
  // (a própria Vercel já manda esse header).
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const shareUrl = `${protocol}://${host}/b/${business.slug}`;

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Configurações" subtitle={business.name} />

        <main className="px-5 lg:px-10 py-8 max-w-md mx-auto space-y-6">
          <ShareLinkCard url={shareUrl} />

          <BusinessHoursForm initialRows={hoursRowsFormatted} />

          <BusinessProfileForm
            initialAddress={profile?.address ?? ""}
            initialMapsUrl={profile?.maps_url ?? ""}
            initialHasWifi={profile?.has_wifi ?? false}
            initialHasKidsArea={profile?.has_kids_area ?? false}
            initialHasParking={profile?.has_parking ?? false}
            initialHasAccessibility={profile?.has_accessibility ?? false}
          />
        </main>
      </div>
    </div>
  );
}
