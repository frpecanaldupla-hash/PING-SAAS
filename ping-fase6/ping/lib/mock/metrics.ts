import type { Appointment, Client, Transaction } from "@/lib/types";

// Tudo derivado dos dados do dia — quando o Supabase estiver conectado, isso
// vira uma query agregada (`select sum(amount)... where created_at::date = today`)
// em vez de reduzir arrays em memória.

export function todayRevenue(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function activeClientsCount(clients: Client[]) {
  return clients.filter((c) => c.totalVisits > 0).length;
}

export function returnRate(clients: Client[]) {
  const returning = clients.filter((c) => c.totalVisits > 1).length;
  if (clients.length === 0) return 0;
  return Math.round((returning / clients.length) * 100);
}

export function completedToday(appointments: Appointment[]) {
  return appointments.filter((a) => a.status === "completed").length;
}
