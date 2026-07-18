import type { Appointment, Client, Transaction } from "@/lib/types";

// Tudo derivado dos dados do dia — quando o Supabase estiver conectado, isso
// vira uma query agregada (`select sum(amount)... where created_at::date = today`)
// em vez de reduzir arrays em memória.

// Aceita apenas os campos usados (Pick), não o tipo completo — o dashboard
// busca só `amount`/`type` e `totalVisits` do Supabase, então exigir o
// objeto inteiro (Client/Transaction completos) faria o TypeScript recusar
// esse cast no build (next build roda checagem de tipos por padrão).
export function todayRevenue(transactions: Pick<Transaction, "amount" | "type">[]) {
  return transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function activeClientsCount(clients: Pick<Client, "totalVisits">[]) {
  return clients.filter((c) => c.totalVisits > 0).length;
}

export function returnRate(clients: Pick<Client, "totalVisits">[]) {
  const returning = clients.filter((c) => c.totalVisits > 1).length;
  if (clients.length === 0) return 0;
  return Math.round((returning / clients.length) * 100);
}

export function completedToday(appointments: Appointment[]) {
  return appointments.filter((a) => a.status === "completed").length;
}
