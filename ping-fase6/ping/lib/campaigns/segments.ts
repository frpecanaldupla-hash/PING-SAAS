import type { Client, FidelityConfig, Campaign } from "@/lib/types";

// TODO(fase seguinte): trocar a geração de mensagem por uma chamada real à
// API da Anthropic (`/v1/messages`) recebendo o segmento e o histórico do
// negócio como contexto. Hoje é regra fixa por segmento — determinístico e
// sem custo de API, mas é só um texto padrão, não é "IA" de verdade ainda.

function daysSince(iso: string | null) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function inactiveClients(clients: Client[], days = 30) {
  return clients.filter((c) => daysSince(c.lastVisitAt) >= days);
}

export function birthdayClients(clients: Client[]) {
  const today = new Date();
  return clients.filter((c) => {
    if (!c.birthday) return false;
    const b = new Date(c.birthday);
    return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
  });
}

export function highPointsClients(clients: Client[], config: FidelityConfig) {
  return clients.filter((c) => c.points >= config.rewardThreshold * 0.7);
}

const AUDIENCE_LABEL: Record<Campaign["audience"], string> = {
  todos: "Todos os clientes",
  inativos_30d: "Inativos há 30+ dias",
  aniversariantes: "Aniversariantes de hoje",
  pontos_altos: "Perto do resgate",
};

export function suggestCampaign(clients: Client[], config: FidelityConfig) {
  // Prioridade da sugestão: aniversariante > inativo > perto do resgate.
  const birthdays = birthdayClients(clients);
  if (birthdays.length > 0) {
    return {
      audience: "aniversariantes" as const,
      audienceLabel: AUDIENCE_LABEL.aniversariantes,
      matched: birthdays,
      message: `Parabéns! Hoje é seu dia 🎉 Ganhe ${Math.round(config.pointsPerVisit * 2)} pontos de bônus se passar aqui essa semana.`,
    };
  }

  const inactive = inactiveClients(clients, 30);
  if (inactive.length > 0) {
    return {
      audience: "inativos_30d" as const,
      audienceLabel: AUDIENCE_LABEL.inativos_30d,
      matched: inactive,
      message: `Faz tempo que a gente não te vê por aqui! Que tal marcar um horário essa semana? Separei um combo especial pra você.`,
    };
  }

  const highPoints = highPointsClients(clients, config);
  return {
    audience: "pontos_altos" as const,
    audienceLabel: AUDIENCE_LABEL.pontos_altos,
    matched: highPoints,
    message: `Você está quase lá! Faltam poucos pontos para resgatar R$ ${config.rewardValue.toFixed(0)} de desconto. Aproveita essa semana.`,
  };
}
