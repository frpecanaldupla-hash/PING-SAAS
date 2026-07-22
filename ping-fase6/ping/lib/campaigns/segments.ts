import type { Client, FidelityConfig } from "@/lib/types";
import { todayDateOnlyBrasilia } from "@/lib/time/brasilia";

// TODO(fase seguinte): trocar a geração de mensagem por uma chamada real à
// API da Anthropic (`/v1/messages`) recebendo o segmento e o histórico do
// negócio como contexto. Hoje é regra fixa por segmento — determinístico e
// sem custo de API, mas é só um texto padrão, não é "IA" de verdade ainda.

export type SegmentKind = "aniversariantes" | "sumidos" | "pontos_altos" | "todos";

function daysSince(iso: string | null) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function inactiveClients(clients: Client[], days = 30) {
  return clients.filter((c) => daysSince(c.lastVisitAt) >= days);
}

// Mês, não dia exato — "aniversariantes do mês" dá tempo real de mandar a
// mensagem antes da data (diferente da sugestão antiga, que só pegava quem
// fazia aniversário hoje). `c.birthday` é data-only ("1990-07-19"), que o JS
// sempre interpreta como meia-noite UTC — por isso getUTCMonth, não getMonth,
// senão o fuso do navegador desloca o mês perto da virada. `today` já vem
// pronta com os componentes certos de Brasília via construtor local.
export function birthdayMonthClients(clients: Client[], monthIndex = todayDateOnlyBrasilia().getMonth()) {
  return clients.filter((c) => {
    if (!c.birthday) return false;
    return new Date(c.birthday).getUTCMonth() === monthIndex;
  });
}

export function highPointsClients(clients: Client[], config: FidelityConfig) {
  return clients.filter((c) => c.points >= config.rewardThreshold * 0.7);
}

export const SEGMENT_ORDER: SegmentKind[] = ["aniversariantes", "sumidos", "pontos_altos", "todos"];

export const SEGMENT_LABEL: Record<SegmentKind, string> = {
  aniversariantes: "Aniversariantes do mês",
  sumidos: "Sumidos",
  pontos_altos: "Nível de fidelidade",
  todos: "Todos os clientes",
};

// Mesmo enum de audience já usado na tabela `campaigns` (ver
// supabase/migrations/0001_init.sql) — "pontos_altos" e "sumidos" mapeiam
// pros nomes que a coluna já esperava antes desse segmento virar escolha
// manual (era "inativos_30d" fixo; agora o dono escolhe o X dias).
export const SEGMENT_AUDIENCE: Record<SegmentKind, "todos" | "inativos_30d" | "aniversariantes" | "pontos_altos"> = {
  aniversariantes: "aniversariantes",
  sumidos: "inativos_30d",
  pontos_altos: "pontos_altos",
  todos: "todos",
};

export function defaultMessageFor(kind: SegmentKind, config: FidelityConfig) {
  switch (kind) {
    case "aniversariantes":
      return `Parabéns pelo mês, {nome}! 🎉 Ganhe pontos de bônus na {negocio} se passar aqui essa semana.`;
    case "sumidos":
      return `Oi {nome}, faz tempo que a gente não te vê na {negocio}! Que tal marcar um horário essa semana?`;
    case "pontos_altos":
      return `{nome}, você está quase lá! Faltam poucos pontos pra resgatar R$ ${config.rewardValue.toFixed(0)} de desconto na {negocio}.`;
    case "todos":
      return `Oi {nome}! Passando aqui pra lembrar que a {negocio} está te esperando. Bora marcar um horário?`;
  }
}

export function clientsForSegment(
  kind: SegmentKind,
  clients: Client[],
  config: FidelityConfig,
  options?: { inactiveDays?: number }
) {
  switch (kind) {
    case "aniversariantes":
      return birthdayMonthClients(clients);
    case "sumidos":
      return inactiveClients(clients, options?.inactiveDays ?? 30);
    case "pontos_altos":
      return highPointsClients(clients, config);
    case "todos":
      return clients;
  }
}

// Ponto de partida do seletor: mesma prioridade da sugestão automática que
// existia antes (aniversariante > sumido > perto do resgate), só que agora é
// só o valor inicial dos chips — o dono pode trocar pra qualquer segmento.
export function defaultSegment(clients: Client[], config: FidelityConfig): SegmentKind {
  if (birthdayMonthClients(clients).length > 0) return "aniversariantes";
  if (inactiveClients(clients, 30).length > 0) return "sumidos";
  if (highPointsClients(clients, config).length > 0) return "pontos_altos";
  return "todos";
}
