// Janela de exibição da agenda e helpers de posicionamento do grid.
// Tudo em minutos desde 00:00 para virar `top`/`height` em porcentagem sem
// depender de nenhuma lib de calendário.

export const AGENDA_START_MIN = 8 * 60; // 08:00
export const AGENDA_END_MIN = 20 * 60; // 20:00
export const AGENDA_SPAN_MIN = AGENDA_END_MIN - AGENDA_START_MIN;

export function minutesSinceMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Retorna { top, height } em % relativos à janela AGENDA_START_MIN..AGENDA_END_MIN
export function blockPosition(startIso: string, endIso: string) {
  const start = Math.max(minutesSinceMidnight(startIso), AGENDA_START_MIN);
  const end = Math.min(minutesSinceMidnight(endIso), AGENDA_END_MIN);
  const top = ((start - AGENDA_START_MIN) / AGENDA_SPAN_MIN) * 100;
  const height = ((end - start) / AGENDA_SPAN_MIN) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 4)}%` };
}

export function hourMarks() {
  const marks: number[] = [];
  for (let m = AGENDA_START_MIN; m <= AGENDA_END_MIN; m += 60) marks.push(m);
  return marks;
}

export function minutesToLabel(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
