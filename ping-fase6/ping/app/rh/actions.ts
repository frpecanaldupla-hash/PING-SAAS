"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// Adiciona um profissional "sem login próprio" — mesma lógica que já vale
// pra Lucas/Thiago no mock: entram na Agenda pra receber horários e no
// cálculo de comissão, mas quem opera o sistema continua sendo o dono
// logado. Convite por e-mail (pra esse profissional logar sozinho) é uma
// decisão maior, separada, ainda não implementada.
export async function addProfessional(name: string, commissionPercent: number | null) {
  const cleanName = name.trim();
  if (!cleanName) return { error: "Digite um nome." };

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      business_id: business.id,
      name: cleanName,
      role: "professional",
      active: true,
      commission_percent: commissionPercent,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível adicionar o profissional." };
  }

  revalidatePath("/rh");
  revalidatePath("/agenda");
  return { error: null, id: data.id as string };
}

// Um único update pra nome, comissão e status — os três campos editáveis do
// cartão da Equipe. Cada chamada manda só o que mudou.
export async function updateProfessional(
  id: string,
  fields: { name?: string; commissionPercent?: number | null; active?: boolean }
) {
  const update: Record<string, unknown> = {};

  if (fields.name !== undefined) {
    const clean = fields.name.trim();
    if (!clean) return { error: "Digite um nome." };
    update.name = clean;
  }
  if (fields.commissionPercent !== undefined) {
    update.commission_percent = fields.commissionPercent;
  }
  if (fields.active !== undefined) {
    update.active = fields.active;
  }

  if (Object.keys(update).length === 0) {
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("professionals").update(update).eq("id", id);

  if (error) {
    return { error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/rh");
  revalidatePath("/agenda");
  return { error: null };
}
