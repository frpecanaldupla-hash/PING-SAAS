// ADICIONAR ao final de app/agenda/actions.ts (mantém o que já existe lá,
// como renameProfessional, searchClients, createAppointment).

// Concluir é o que efetivamente gera dinheiro no sistema: sem isso, nenhuma
// transação nasce e o Financeiro fica pra sempre vazio, não importa quantas
// telas existam em cima dele. Além da receita, se o profissional tiver
// commission_percent configurado, já lança a comissão dele automaticamente
// — dois lançamentos, uma ação só.
export async function completeAppointment(
  appointmentId: string,
  amount: number,
  method: "pix" | "cartao" | "dinheiro"
) {
  if (!amount || amount <= 0) return { error: "Informe um valor válido." };

  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, business_id, professional_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) return { error: "Agendamento não encontrado." };

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "completed", total_price: amount })
    .eq("id", appointmentId);

  if (updateError) return { error: "Não foi possível concluir o agendamento." };

  await supabase.from("transactions").insert({
    business_id: appointment.business_id,
    appointment_id: appointment.id,
    professional_id: appointment.professional_id,
    amount,
    method,
    type: "receita",
  });

  const { data: professional } = await supabase
    .from("professionals")
    .select("commission_percent")
    .eq("id", appointment.professional_id)
    .maybeSingle();

  if (professional?.commission_percent) {
    const commissionAmount = Number(
      (amount * (professional.commission_percent / 100)).toFixed(2)
    );
    await supabase.from("transactions").insert({
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      professional_id: appointment.professional_id,
      amount: commissionAmount,
      method,
      type: "comissao",
    });
  }

  revalidatePath("/agenda");
  revalidatePath("/financeiro");
  return { error: null };
}
