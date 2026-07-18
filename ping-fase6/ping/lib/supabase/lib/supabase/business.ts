import type { SupabaseClient } from "@supabase/supabase-js";

// Toda página autenticada precisa saber "qual negócio é esse usuário" antes
// de buscar qualquer outro dado. Helper único pra não repetir esse join em
// cada page.tsx — e pra sumir de vez com nomes fixos tipo "Barbearia
// Central" espalhados pela UI.
export async function getCurrentBusiness(supabase: SupabaseClient) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from("business_members")
    .select("role, businesses ( id, name, slug, logo_url, created_at )")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();

  if (!data?.businesses) return null;

  // A relação vem como objeto ou array dependendo de como o Supabase infere
  // a FK sem tipos gerados — cobre os dois casos.
  const business = Array.isArray(data.businesses) ? data.businesses[0] : data.businesses;
  if (!business) return null;

  return {
    id: business.id as string,
    name: business.name as string,
    slug: business.slug as string,
    role: data.role as string,
  };
}
