"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";

// Registrado uma vez por "leva" de envios (mesmo segmento + mesma mensagem),
// não uma vez por cliente contatado — ver CampaignSender: o front só chama
// isso no primeiro clique em "Enviar via WhatsApp" depois de trocar de
// segmento ou editar a mensagem. Sem isso, mandar pra 40 clientes sumidos
// viraria 40 linhas idênticas no Histórico.
export async function logCampaignSend(input: {
  name: string;
  audience: "todos" | "inativos_30d" | "aniversariantes" | "pontos_altos";
  message: string;
}) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) return { error: "Negócio não encontrado." };

  const { error } = await supabase.from("campaigns").insert({
    business_id: business.id,
    name: input.name,
    message: input.message,
    audience: input.audience,
    status: "enviada",
  });

  if (error) return { error: "Não foi possível registrar a campanha." };

  revalidatePath("/campanhas");
  return { error: null };
}
