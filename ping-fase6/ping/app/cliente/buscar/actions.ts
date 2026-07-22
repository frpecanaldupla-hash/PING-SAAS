"use server";

import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

// Busca pública por nome de negócio — sem sessão nenhuma (nem staff, nem
// cliente). Service role de propósito: RLS de `businesses` só libera
// leitura pra quem já é membro (ver migration 0013_business_profile.sql).
// Usado por quem quer se cadastrar mas não tem o link direto de /b/[slug]
// que o dono compartilha.
export async function searchBusinesses(query: string) {
  const q = query.trim();
  if (q.length < 2) return { businesses: [] as { name: string; slug: string }[] };

  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("businesses").select("name, slug").ilike("name", `%${q}%`).limit(10);

  return { businesses: data ?? [] };
}
