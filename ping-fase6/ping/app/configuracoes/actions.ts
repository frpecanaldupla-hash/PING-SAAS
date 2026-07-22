"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// Salva o perfil público do negócio (amenidades + localização, ver
// migration 0013_business_profile.sql) — exibido em /cliente por enquanto;
// a Fase 5 (perfil público em /b/[slug]) reaproveita as mesmas colunas.
export async function updateBusinessProfile(input: {
  address: string;
  mapsUrl: string;
  hasWifi: boolean;
  hasKidsArea: boolean;
  hasParking: boolean;
  hasAccessibility: boolean;
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const address = input.address.trim();
  let mapsUrl = input.mapsUrl.trim();
  // O dono normalmente cola só o link compartilhado pelo Google Maps — se
  // vier sem esquema, o botão "Como chegar" (href cru) trataria como link
  // relativo do próprio site e quebraria. Prependa https:// só quando faltar.
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) {
    mapsUrl = `https://${mapsUrl}`;
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      address: address || null,
      maps_url: mapsUrl || null,
      has_wifi: input.hasWifi,
      has_kids_area: input.hasKidsArea,
      has_parking: input.hasParking,
      has_accessibility: input.hasAccessibility,
    })
    .eq("id", business.id);

  if (error) return { error: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/configuracoes");
  revalidatePath("/cliente");
  return { error: null };
}

// Salva as 7 linhas de horário de funcionamento (ver migration
// 0011_business_hours.sql) — upsert numa tacada só, sempre as 7 juntas
// (mesmo que só uma tenha mudado), porque a chave é composta
// (business_id, weekday) e o form já mantém o estado completo dos 7 dias.
export async function updateBusinessHours(
  rows: { weekday: number; opensAt: string; closesAt: string; closed: boolean }[]
) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  for (const row of rows) {
    if (!row.closed && row.opensAt >= row.closesAt) {
      return { error: "O horário de abertura precisa ser antes do de fechamento." };
    }
  }

  const { error } = await supabase.from("business_hours").upsert(
    rows.map((r) => ({
      business_id: business.id,
      weekday: r.weekday,
      opens_at: r.opensAt,
      closes_at: r.closesAt,
      closed: r.closed,
    })),
    { onConflict: "business_id,weekday" }
  );

  if (error) return { error: "Não foi possível salvar os horários. Tente de novo." };

  revalidatePath("/configuracoes");
  revalidatePath("/agenda");
  revalidatePath("/cliente/agendar");
  return { error: null };
}
