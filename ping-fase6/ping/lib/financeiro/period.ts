import { startOfDay, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns";

export type PeriodKey = "hoje" | "semana" | "mes" | "ano";

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  hoje: "Hoje",
  semana: "7 dias",
  mes: "Este mês",
  ano: "Este ano",
};

// "Período anterior" é sempre o intervalo de mesma duração, imediatamente
// antes — mês vs. mês anterior, semana vs. semana anterior, etc.
export function periodRange(period: PeriodKey, now: Date = new Date()) {
  switch (period) {
    case "hoje":
      return {
        current: { start: startOfDay(now), end: now },
        previous: { start: startOfDay(subDays(now, 1)), end: startOfDay(now) },
      };
    case "semana":
      return {
        current: { start: subDays(now, 7), end: now },
        previous: { start: subDays(now, 14), end: subDays(now, 7) },
      };
    case "ano":
      return {
        current: { start: startOfYear(now), end: now },
        previous: { start: startOfYear(subYears(now, 1)), end: startOfYear(now) },
      };
    case "mes":
    default:
      return {
        current: { start: startOfMonth(now), end: now },
        previous: { start: startOfMonth(subMonths(now, 1)), end: startOfMonth(now) },
      };
  }
}
