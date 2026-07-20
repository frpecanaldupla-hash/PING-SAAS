"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

export async function updateMonthlyGoal(target: number) {
  if (!Number.isFinite(target) || target < 0) {
    return { error: "Informe um valor válido." };
  }

  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { error } = await supabase
    .from("revenue_goals")
    .upsert({ business_id: business.id, monthly_target: target }, { onConflict: "business_id" });

  if (error) return { error: "Não foi possível salvar a meta. Tente de novo." };

  revalidatePath("/financeiro");
  return { error: null };
}

export async function cancelTransaction(transactionId: string) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("business_id", business.id);

  if (error) return { error: "Não foi possível cancelar o lançamento. Tente de novo." };

  revalidatePath("/financeiro");
  return
