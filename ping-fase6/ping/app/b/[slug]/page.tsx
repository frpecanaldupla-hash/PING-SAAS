import Link from "next/link";
import { notFound } from "next/navigation";
import { Accessibility, Baby, Car, Clock, MapPin, Navigation, Wifi } from "lucide-react";
import { PingMark } from "@/components/shared/PingMark";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Perfil público do negócio — deslogado, sem sessão nenhuma (nem staff, nem
// cliente). Service role de propósito: RLS de `businesses` só libera
// leitura pra quem já é membro (ver migration 0013_business_profile.sql,
// que documenta essa escolha). É o ponto de entrada do cadastro
// autoatendido do cliente (Fase 5): o dono compartilha esse link/QR (ver
// Configurações) e quem chega aqui pode criar a própria conta sem depender
// da equipe cadastrar ele num agendamento primeiro.
export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, address, maps_url, has_wifi, has_kids_area, has_parking, has_accessibility")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) notFound();

  const { data: hoursRows } = await supabase
    .from("business_hours")
    .select("weekday, opens_at, closes_at, closed")
    .eq("business_id", business.id);

  const hours = (hoursRows ?? []).map((h) => ({
    weekday: h.weekday as number,
    opensAt: (h.opens_at as string).slice(0, 5),
    closesAt: (h.closes_at as string).slice(0, 5),
    closed: h.closed as boolean,
  }));

  const amenities = [
    { label: "Wi-Fi", icon: Wifi, enabled: business.has_wifi },
    { label: "Kids", icon: Baby, enabled: business.has_kids_area },
    { label: "Estacionamento", icon: Car, enabled: business.has_parking },
    { label: "Acessível", icon: Accessibility, enabled: business.has_accessibility },
  ].filter((a) => a.enabled);

  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 px-6 py-12 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10 w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8 animate-rise">
          <PingMark size={88} />
          <h1 className="font-display text-4xl tracking-wide mt-2 text-center leading-tight">
            {business.name}
          </h1>
        </div>

        {amenities.length > 0 && (
          <div
            className="flex flex-wrap justify-center gap-2 mb-4 animate-rise"
            style={{ animationDelay: "0.06s" }}
          >
            {amenities.map((a) => (
              <span
                key={a.label}
                className="inline-flex items-center gap-1.5 text-xs text-paper-400 bg-ink-800 border border-ink-700 rounded-full px-3 py-1.5"
              >
                <a.icon size={13} className="text-brass-400" /> {a.label}
              </span>
            ))}
          </div>
        )}

        {(business.address || business.maps_url) && (
          <div className="animate-rise mb-4" style={{ animationDelay: "0.1s" }}>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-paper-500 mb-2 flex items-center gap-2">
                <MapPin size={13} /> Localização
              </p>
              {business.address && <p className="text-sm text-paper-400 mb-3">{business.address}</p>}
              {business.maps_url && (
                <a
                  href={business.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-signal-400 hover:text-signal-300 font-semibold transition-colors"
                >
                  <Navigation size={15} /> Como chegar
                </a>
              )}
            </Card>
          </div>
        )}

        {hours.length > 0 && (
          <div className="animate-rise mb-6" style={{ animationDelay: "0.14s" }}>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-paper-500 mb-3 flex items-center gap-2">
                <Clock size={13} /> Horário de funcionamento
              </p>
              <div className="space-y-1.5">
                {DISPLAY_ORDER.map((weekday) => {
                  const row = hours.find((h) => h.weekday === weekday);
                  if (!row) return null;
                  return (
                    <div key={weekday} className="flex items-center justify-between text-xs">
                      <span className="text-paper-500">{WEEKDAY_LABELS[weekday]}</span>
                      <span className="text-paper-100">
                        {row.closed ? "Fechado" : `${row.opensAt} – ${row.closesAt}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        <div className="space-y-3 animate-rise" style={{ animationDelay: "0.18s" }}>
          <ButtonLink href={`/b/${slug}/cadastro`} size="lg" className="w-full">
            Criar minha conta
          </ButtonLink>
          <Link
            href={`/cliente/entrar?negocio=${slug}`}
            className="block text-center text-sm text-paper-500 hover:text-paper-50 transition-colors"
          >
            Já sou cliente daqui — entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
