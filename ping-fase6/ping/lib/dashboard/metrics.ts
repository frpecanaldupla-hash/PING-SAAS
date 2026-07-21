import type { Client, Transaction } from "@/lib/types";

// Aceita apenas os campos usados (Pick), não o tipo completo — o dashboard
// busca só os campos necessários do Supabase, então exigir o objeto inteiro
// faria o TypeScript recusar esse cast no build (next build checa tipos).
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

export function pointsRedeemedToday(transactions: Pick<Transaction, "kind">[]) {
  return transactions.filter((t) => t.kind === "resgate").length;
}
