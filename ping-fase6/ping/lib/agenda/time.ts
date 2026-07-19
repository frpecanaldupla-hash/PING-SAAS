// Janela de exibição da agenda e helpers de posicionamento do grid.
// Tudo em minutos desde 00:00 para virar `top`/`height` em porcentagem sem
// depender de nenhuma lib de calendário.
//
// Fonte única do horário de funcionamento: tanto a grade visual (AgendaGrid)
// quanto os horários oferecidos no agendamento (BookingDrawer) importam
// essas duas constantes — mudar o horário de funcionamento do negócio é
// mudar só aqui, não em cada arquivo que usa hora.

export const AGENDA_START_MIN = 7 * 60; // 07:00
export const AGENDA_END_MIN = 23 * 60; // 23:00
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

// Lista de horários "redondos" (de stepMinutes em stepMinutes) dentro da
// janela de funcionamento — usada pelo BookingDrawer para oferecer
// horários. Fica aqui, não como array fixo no componente, porque precisa
// acompanhar AGENDA_START_MIN/END_MIN automaticamente.
export function generateSlotLabels(stepMinutes = 30) {
  const slots: string[] = [];
  for (let m = AGENDA_START_MIN; m < AGENDA_END_MIN; m += stepMinutes) {
    slots.push(minutesToLabel(m));
  }
  return slots;
}

// Um horário só é oferecível se o serviço couber antes do fechamento —
// sem isso, dava pra marcar às 22:50 um serviço de 40min que só termina
// depois da meia-noite.
export function slotFitsBeforeClosing(slotLabel: string, durationMinutes: number) {
  const [h, m] = slotLabel.split(":").map(Number);
  return h * 60 + m + durationMinutes <= AGENDA_END_MIN;
}

// Encaixa um instante (em minutos desde 00:00) no intervalo de horário de
// funcionamento e arredonda para o múltiplo de `stepMinutes` mais próximo —
// usado pelo drag-and-drop da Agenda para transformar a posição Y do mouse
// num horário "limpo" (sem cair em 09:47, por exemplo).
export function clampAndSnapMinutes(minutes: number, durationMinutes: number, stepMinutes = 5) {
  const snapped = Math.round(minutes / stepMinutes) * stepMinutes;
  const maxStart = AGENDA_END_MIN - durationMinutes;
  return Math.min(Math.max(snapped, AGENDA_START_MIN), Math.max(maxStart, AGENDA_START_MIN));
}
