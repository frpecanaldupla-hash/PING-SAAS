"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Renomear usa a mesma policy de RLS "member full access" de professionals
// (ver supabase/migrations/0001_init.sql) — qualquer membro do negócio pode
// editar, sem precisar de nenhuma função nova no banco. Hoje só usamos isso
// pro próprio dono editar o próprio nome; quando a Equipe tiver mais gente,
// dá pra restringir no app quem vê o lápis em qual chip.
export async function renameProfessional(id: string, name: string) {
  const cleanName = name.trim();
  if (!cleanName) {
    return { error: "Digite um nome." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update({ name: cleanName })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível salvar o nome. Tente de novo." };
  }

  revalidatePath("/agenda");
  return { error: null };
}
