import type { Appointment } from "@/lib/types";

// Janela de exibição da agenda e helpers de posicionamento do grid.
// Tudo em minutos desde 00:00 para virar `top`/`height` em porcentagem sem
// depender de nenhuma lib de calendário.
//
// Fonte única do horário de funcionamento: tanto a grade visual (AgendaGrid)
// quanto os horários oferecidos no agendamento (BookingDrawer,
// ClientBookingFlow) importam essas duas constantes — mudar o horário de
// funcionamento do negócio é mudar só aqui, não em cada arquivo que usa hora.

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

// --- Escolha de dia + horário no agendamento (equipe e cliente) ---
// Antes disso, o BookingDrawer calculava o horário escolhido sempre em cima
// de `new Date()` (o dia em que a tela foi aberta) — não dava pra agendar
// num dia diferente de hoje. Essas funções recebem o dia escolhido como
// parâmetro explícito, compartilhadas entre o fluxo da equipe
// (BookingDrawer) e o da Área do Cliente (ClientBookingFlow).
//
// Tudo aqui roda no NAVEGADOR (client component) e trabalha com "dateOnly"
// em fuso LOCAL (meia-noite local, via new Date(y, m-1, d) e métodos sem
// "UTC" no nome) — de propósito diferente do dateOnly em UTC de
// lib/time/brasilia.ts (esse é só pra uso no servidor, pareado com
// startOfDayBrasilia). São dois formatos de "só a data" que não devem se
// misturar: a única coisa que atravessa a fronteira cliente/servidor é a
// string "YYYY-MM-DD" pura (query param ?data=, argumento de Server Action).

/** Converte "YYYY-MM-DD" num Date de meia-noite LOCAL — usar só no cliente. */
export function parseLocalDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Formata um Date de volta pra "YYYY-MM-DD" usando os campos LOCAIS — contraparte de parseLocalDateOnly. */
export function formatLocalDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Lista os próximos `n` dias a partir de `from` (padrão: hoje), com hora zerada no fuso do navegador — usado pelos chips de dia do agendamento. */
export function nextNDays(n: number, from: Date = new Date()): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/** Rótulo curto pro chip de dia: "Hoje", "Amanhã" ou "Sáb 25/07". */
export function dayChipLabel(date: Date, today: Date = new Date()): string {
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const t0 = new Date(today);
  t0.setHours(0, 0, 0, 0);
  if (isSameDay(date, t0)) return "Hoje";

  const tomorrow = new Date(t0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Amanhã";

  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const dayMonth = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1, 3)} ${dayMonth}`;
}

/** Rótulo completo pro cabeçalho da Agenda: "sábado, 25 de julho". */
export function fullDateLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

/** Instante ISO de um horário ("14:30") aplicado a um dia específico escolhido pelo usuário — roda no navegador (do dono ou do cliente), então usa o fuso local dele, que na prática é sempre Brasília. */
export function slotToISO(dateOnly: Date, slotLabel: string): string {
  const [h, m] = slotLabel.split(":").map(Number);
  const d = new Date(dateOnly);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function addMinutesISO(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

/** Um horário só é oferecível se não colidir com nenhum agendamento existente (não cancelado) desse profissional — ajuda visual; quem garante de verdade, contra corrida de duas telas confirmando ao mesmo tempo, é a checagem do lado do servidor (createAppointment/createMyAppointment). */
export function isSlotFree(
  dateOnly: Date,
  slotLabel: string,
  durationMinutes: number,
  professionalId: string,
  appointments: Pick<Appointment, "professionalId" | "status" | "startAt" | "endAt">[]
) {
  const start = slotToISO(dateOnly, slotLabel);
  const end = addMinutesISO(start, durationMinutes);
  return !appointments.some(
    (a) =>
      a.professionalId === professionalId &&
      a.status !== "cancelled" &&
      a.startAt < end &&
      a.endAt > start
  );
}
