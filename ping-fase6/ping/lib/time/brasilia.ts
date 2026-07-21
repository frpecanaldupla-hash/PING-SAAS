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

// Um "dateOnly" é um Date que representa só um dia de calendário (sem hora),
// guardado como meia-noite UTC nominal — é o valor que circula entre as
// funções abaixo e o que a Agenda usa pra navegar entre dias (via
// parseDateOnlyISO/formatDateOnlyISO). Nunca deve ser exibido nem comparado
// como instante real; pra isso, sempre passe por startOfDayBrasilia() antes.
export function todayDateOnly(): Date {
  const { year, month, day } = todayPartsInBrasilia();
  return new Date(Date.UTC(year, month - 1, day));
}

/** Converte "YYYY-MM-DD" (ex: query param ?data=2026-07-25) num dateOnly. */
export function parseDateOnlyISO(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** Formata um dateOnly de volta pra "YYYY-MM-DD", para usar em query params/links. */
export function formatDateOnlyISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Meia-noite de um dateOnly em Brasília, como instante UTC real (para comparar com colunas timestamptz do Postgres). Sem argumento, usa hoje. */
export function startOfDayBrasilia(dateOnly: Date = todayDateOnly()): Date {
  const year = dateOnly.getUTCFullYear();
  const month = dateOnly.getUTCMonth();
  const day = dateOnly.getUTCDate();
  return new Date(Date.UTC(year, month, day, BR_UTC_OFFSET_HOURS, 0, 0, 0));
}

/** Meia-noite do dia seguinte a um dateOnly, em Brasília — junto com startOfDayBrasilia(), define o intervalo `gte`/`lt` de um dia inteiro. Sem argumento, usa hoje. */
export function startOfNextDayBrasilia(dateOnly: Date = todayDateOnly()): Date {
  return new Date(startOfDayBrasilia(dateOnly).getTime() + 24 * 60 * 60 * 1000);
}

/** Meia-noite de "hoje" em Brasília. Atalho equivalente a startOfDayBrasilia() sem argumento — mantido por clareza no código que só lida com hoje. */
export function startOfTodayBrasilia(): Date {
  return startOfDayBrasilia(todayDateOnly());
}

/** Meia-noite de "amanhã" em Brasília. */
export function startOfTomorrowBrasilia(): Date {
  return startOfNextDayBrasilia(todayDateOnly());
}

/** Par de datas (ISO, prontas pro Supabase) que define o intervalo de um dia inteiro. Sem argumento, o dia é hoje; passe um dateOnly (ver parseDateOnlyISO) para outro dia. */
export function brasiliaDayRangeISO(dateOnly: Date = todayDateOnly()): {
  startOfToday: string;
  startOfTomorrow: string;
} {
  return {
    startOfToday: startOfDayBrasilia(dateOnly).toISOString(),
    startOfTomorrow: startOfNextDayBrasilia(dateOnly).toISOString(),
  };
}

/** "Hoje" como Date, com ano/mês/dia corretos para Brasília (hora zerada). Útil para comparar mês/dia, como em aniversariantes. */
export function todayDateOnlyBrasilia(): Date {
  const { year, month, day } = todayPartsInBrasilia();
  return new Date(year, month - 1, day);
}

/** Rótulo tipo "Domingo, 19 de julho" para "hoje", sempre no fuso de Brasília. */
export function todayLabelBrasilia(): string {
  return dateOnlyLabel(todayDateOnly());
}

/** Rótulo tipo "sábado, 25 de julho" para um dateOnly qualquer (ver parseDateOnlyISO). Como dateOnly já representa o dia certo (meia-noite UTC nominal), formata em UTC — não em Brasília — pra não arriscar cair no dia anterior/seguinte. */
export function dateOnlyLabel(dateOnly: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dateOnly);
}

/** Compara se um dateOnly é hoje (Brasília). Usado pra rotular o chip "Hoje" nos seletores de data. */
export function isTodayBrasilia(dateOnly: Date): boolean {
  return formatDateOnlyISO(dateOnly) === formatDateOnlyISO(todayDateOnly());
}
