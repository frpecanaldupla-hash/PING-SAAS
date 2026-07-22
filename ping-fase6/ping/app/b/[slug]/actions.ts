"use server";

import crypto from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { createClientSession, hashPin } from "@/lib/client-portal/session";
import { assertClientLimitOk } from "@/lib/billing/limits";

// Cadastro de cliente direto num negócio específico, via /b/[slug] — ao
// contrário do fluxo antigo, onde um cliente só passava a existir depois de
// a equipe cadastrar ele num agendamento (ver createAppointment em
// app/agenda/actions.ts), aqui o próprio cliente cria a linha em `clients`.
//
// O id é gerado ANTES do insert (em vez de deixar o default do banco)
// porque hashPin precisa do id pra salgar a senha (ver
// lib/client-portal/session.ts) — só teríamos o id de volta DEPOIS de um
// insert comum. Gerando antes, cliente e pin_hash entram na mesma linha,
// na mesma escrita — sem estado parcial se alguma etapa falhar no meio.
export async function registerClientForBusiness(input: {
  slug: string;
  name: string;
  phone: string;
  pin: string;
}) {
  const name = input.name.trim();
  const phoneDigits = input.phone.replace(/\D/g, "");

  if (!name) return { error: "Digite seu nome." };
  if (phoneDigits.length < 8) return { error: "Digite um telefone válido." };
  if (!/^\d{4}$/.test(input.pin)) return { error: "A senha precisa ter exatamente 4 números." };

  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (!business) return { error: "Negócio não encontrado." };

  // `clients` tem unique (business_id, phone) — ver 0001_init.sql. Um
  // cadastro já existente aqui precisa entrar pela tela de login (que
  // resolve por PIN), não criar um segundo registro pro mesmo telefone.
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("business_id", business.id)
    .eq("phone", phoneDigits)
    .maybeSingle();

  if (existing) {
    return {
      error: "Esse telefone já tem cadastro aqui. Entre pela tela de login em vez de criar uma conta nova.",
    };
  }

  const limit = await assertClientLimitOk(supabase, business.id);
  if (!limit.ok) return { error: limit.error };

  const clientId = crypto.randomUUID();

  const { error: insertError } = await supabase.from("clients").insert({
    id: clientId,
    business_id: business.id,
    name,
    phone: phoneDigits,
    pin_hash: hashPin(input.pin, clientId),
    pin_set_at: new Date().toISOString(),
  });

  if (insertError) {
    return { error: "Não foi possível criar sua conta. Tente de novo." };
  }

  await createClientSession(clientId);
  return { error: null };
}
