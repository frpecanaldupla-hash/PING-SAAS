"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

export async function createService(formData: FormData) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const name = String(formData.get("name") || "").trim();
  const price = Number(String(formData.get("price") || "0").replace(",", "."));
  const duration = Number(formData.get("duration") || 30);
  const isCombo = formData.get("isCombo") === "on";

  if (!name) return { error: "Dê um nome pro serviço." };

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name,
    price: Number.isFinite(price) ? price : 0,
    duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : 30,
    is_combo: isCombo,
    active: true,
  });

  if (error) return { error: "Não foi possível salvar o serviço." };
  revalidatePath("/servicos");
  return { error: null };
}

export async function updateServicePrice(id: string, price: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ price: Number.isFinite(price) ? price : 0 })
    .eq("id", id);

  if (error) return { error: "Não foi possível atualizar o preço." };
  revalidatePath("/servicos");
  return { error: null };
}

export async function deleteService(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    // Provavelmente algum agendamento já referencia esse serviço — em vez
    // de travar, arquiva (some da lista, mas preserva o histórico).
    const { error: archiveError } = await supabase
      .from("services")
      .update({ active: false })
      .eq("id", id);
    if (archiveError) return { error: "Não foi possível remover o serviço." };
  }

  revalidatePath("/servicos");
  return { error: null };
}
