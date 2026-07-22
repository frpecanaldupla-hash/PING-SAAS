import type { SupabaseClient } from "@supabase/supabase-js";

// Toda página autenticada precisa saber "qual negócio é esse usuário" antes
// de buscar qualquer outro dado. Helper único pra não repetir esse join em
// cada page.tsx — e pra sumir de vez com nomes fixos tipo "Barbearia
// Central" espalhados pela UI.
//
// getSession() em vez de getUser(): o middleware já chamou getUser() (que
// valida o JWT com o servidor de Auth) nesse mesmo request e renovou o
// cookie se preciso — chamar getUser() de novo aqui só repete um round-trip
// de rede que já foi pago. getSession() lê o JWT do cookie local sem rede.
// Isso é seguro porque a segurança de dados não depende dessa checagem: cada
// query abaixo (e em toda action que usa esse helper) é reforçada pelo RLS
// do Postgres com o JWT real enviado na request — um JWT adulterado ou
// expirado simplesmente não retorna linhas, não importa o que este helper
// "achou" que era o usuário.
export async function getCurrentBusiness(supabase: SupabaseClient) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data } = await supabase
    .from("business_members")
    .select("role, businesses ( id, name, slug, logo_url, created_at )")
    .eq("user_id", user.id)
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
    userId: user.id,
  };
}
