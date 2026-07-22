"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { createClientSession, destroyClientSession, hashPin } from "@/lib/client-portal/session";

type ClientMatch = { id: string; name: string; hasPin: boolean; businessName: string };

// Um mesmo telefone pode existir em mais de um negócio PING (a pessoa é
// cliente da barbearia A e também do salão B) — cada relação é uma linha
// separada em `clients`, com sua própria senha. Por isso a busca retorna
// uma lista, não um único cadastro: se vier mais de um, o LoginFlow mostra
// "qual negócio?" antes de pedir a senha.
//
// `slug` (opcional) vem de /b/[slug] → "Já sou cliente daqui — entrar" (ver
// LoginFlow) — quem chegou por esse link específico já deixou claro qual
// negócio quer, então filtramos pra só aquele antes de decidir se mostra o
// seletor. Só filtra se o telefone tiver conta NESSE negócio; se não tiver
// (ex: link salvo de visita antiga, cadastro só existe em outro), cai de
// volta pra lista completa em vez de travar num "não encontrado" falso.
export async function findClientsByPhone(phone: string, slug?: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return { error: "Digite um telefone válido.", matches: null };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, pin_hash, businesses ( name, slug )")
    .eq("phone", digits);

  if (error) return { error: "Não foi possível buscar seu cadastro.", matches: null };

  if (!data || data.length === 0) {
    return {
      error:
        "Não encontramos nenhum cadastro com esse telefone. Peça pro barbeiro te cadastrar na próxima visita.",
      matches: null,
    };
  }

  let rows = data;
  if (slug) {
    const scoped = rows.filter((c) => {
      const business = Array.isArray(c.businesses) ? c.businesses[0] : c.businesses;
      return (business as { slug?: string } | null)?.slug === slug;
    });
    if (scoped.length > 0) rows = scoped;
  }

  const matches: ClientMatch[] = rows.map((c) => {
    const business = Array.isArray(c.businesses) ? c.businesses[0] : c.businesses;
    return {
      id: c.id as string,
      name: c.name as string,
      hasPin: Boolean(c.pin_hash),
      businessName: (business as { name?: string } | null)?.name ?? "Negócio",
    };
  });

  return { error: null, matches };
}

export async function setupPin(clientId: string, pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    return { error: "A senha precisa ter exatamente 4 números." };
  }

  const supabase = createServiceRoleClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, pin_hash")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return { error: "Cadastro não encontrado." };
  if (client.pin_hash) return { error: "Esse cadastro já tem uma senha. Faça login normalmente." };

  const { error } = await supabase
    .from("clients")
    .update({ pin_hash: hashPin(pin, clientId), pin_set_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) return { error: "Não foi possível salvar a senha. Tente de novo." };

  await createClientSession(clientId);
  return { error: null };
}

export async function loginWithPin(clientId: string, pin: string) {
  const supabase = createServiceRoleClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, pin_hash")
    .eq("id", clientId)
    .maybeSingle();

  if (!client?.pin_hash) return { error: "Cadastro não encontrado." };
  if (client.pin_hash !== hashPin(pin, clientId)) {
    return { error: "Senha incorreta." };
  }

  await createClientSession(clientId);
  return { error: null };
}

export async function logoutClient() {
  await destroyClientSession();
  redirect("/cliente/entrar");
}
