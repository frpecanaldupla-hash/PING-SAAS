// PING roda em servidores da Vercel, que ficam nos EUA e calculam a hora em
// UTC — não no fuso do negócio (Brasília, UTC-3). Qualquer `new Date()` no
// servidor "pensa" que já é amanhã a partir das 21h de Brasília, o que
// bagunça qualquer filtro de "hoje" (Agenda, Check-in, Dashboard, Equipe).
//
// Este arquivo é o ÚNICO lugar que deve calcular "hoje" no servidor.
// Se precisar de "início do dia" em algum código novo, importe daqui —
// não repita `setHours(0, 0, 0, 0)` em outro arquivo.
//
// Brasil aboliu o horário de verão em 2019, então America/Sao_Paulo é
// UTC-3 o ano inteiro — não precisa de lib de fuso horário pesada, só do
// Intl.DateTimeFormat nativo do Node para achar a data "vista" de lá.

const BR_TIME_ZONE = "America/Sao_Paulo";
const BR_UTC_OFFSET_HOURS = 3; // Brasília = UTC-3, fixo (sem DST desde 2019)

function todayPartsInBrasilia(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/** Meia-noite de "hoje" em Brasília, como instante UTC real (para comparar com colunas timestamptz do Postgres). */
export function startOfTodayBrasilia(): Date {
  const { year, month, day } = todayPartsInBrasilia();
  // 00:00 em Brasília (UTC-3) é 03:00 em UTC do mesmo dia civil.
  return new Date(Date.UTC(year, month - 1, day, BR_UTC_OFFSET_HOURS, 0, 0, 0));
}

/** Meia-noite de "amanhã" em Brasília — junto com startOfTodayBrasilia(), define o intervalo `gte`/`lt` de um dia inteiro. */
export function startOfTomorrowBrasilia(): Date {
  return new Date(startOfTodayBrasilia().getTime() + 24 * 60 * 60 * 1000);
}

/** Atalho para o par de datas que a maioria das queries de "hoje" precisa, já como string ISO pronta para o Supabase. */
export function brasiliaDayRangeISO(): { startOfToday: string; startOfTomorrow: string } {
  return {
    startOfToday: startOfTodayBrasilia().toISOString(),
    startOfTomorrow: startOfTomorrowBrasilia().toISOString(),
  };
}

/** "Hoje" como Date, com ano/mês/dia corretos para Brasília (hora zerada). Útil para comparar mês/dia, como em aniversariantes. */
export function todayDateOnlyBrasilia(): Date {
  const { year, month, day } = todayPartsInBrasilia();
  return new Date(year, month - 1, day);
}

/** Rótulo tipo "Domingo, 19 de julho" — sempre no fuso de Brasília, não no fuso do servidor. */
export function todayLabelBrasilia(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BR_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}
