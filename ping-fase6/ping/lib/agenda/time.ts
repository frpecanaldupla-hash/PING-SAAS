import type { Appointment, BusinessHours, ProfessionalTimeOff } from "@/lib/types";

// Janela de exibição da agenda e helpers de posicionamento do grid.
// Tudo em minutos desde 00:00 para virar `top`/`height` em porcentagem sem
// depender de nenhuma lib de calendário.
//
// Até a Fase 3, o horário de funcionamento era fixo (AGENDA_START_MIN/END_MIN
// abaixo). Agora é configurável por dia da semana — ver migration
// 0011_business_hours.sql e getDayWindow() logo adiante. As constantes
// continuam existindo só como FALLBACK: se por algum motivo faltar a linha
// de `business_hours` do dia (não deveria acontecer, a migration faz
// backfill de todo negócio existente e create_business_and_owner semeia os
// novos), a agenda cai nesse padrão em vez de quebrar.

export const AGENDA_START_MIN = 7 * 60; // 07:00
export const AGENDA_END_MIN = 23 * 60; // 23:00
export const AGENDA_SPAN_MIN = AGENDA_END_MIN - AGENDA_START_MIN;

// Janela de funcionamento de UM dia específico, já resolvida em minutos —
// o que toda função de grid/slot abaixo passa a receber em vez de ler as
// constantes fixas direto. `closed` vem primeiro na checagem de quem usa:
// se `closed`, nenhuma das outras funções deste arquivo deveria ser chamada
// (AgendaGrid, BookingDrawer e ClientBookingFlow mostram um estado de
// "fechado nesse dia" antes de tentar montar grade ou lista de horários).
export interface DayWindow {
  startMin: number;
  endMin: number;
  closed: boolean;
}

function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Resolve a janela de funcionamento de um dia específico a partir das 7 linhas de `business_hours` do negócio (ver migration 0011). `dateOnly` usa a mesma convenção de Date local das demais funções deste arquivo — `.getDay()` bate com o `weekday` gravado no banco (0=domingo..6=sábado). */
export function getDayWindow(hours: BusinessHours[], dateOnly: Date): DayWindow {
  const weekday = dateOnly.getDay();
  const row = hours.find((h) => h.weekday === weekday);

  if (!row) {
    // Não deveria acontecer (ver comentário no topo do arquivo) — cai no
    // padrão fixo antigo em vez de tratar como "fechado", pra um negócio
    // nunca perder agenda inteira por uma linha faltando.
    return { startMin: AGENDA_START_MIN, endMin: AGENDA_END_MIN, closed: false };
  }

  if (row.closed) {
    return { startMin: 0, endMin: 0, closed: true };
  }

  return {
    startMin: parseTimeToMinutes(row.opensAt),
    endMin: parseTimeToMinutes(row.closesAt),
    closed: false,
  };
}

export function minutesSinceMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Retorna { top, height } em % relativos à janela do dia (dayWindow.startMin..endMin).
// Parâmetro chamado `dayWindow`, não `window` — este arquivo roda no
// navegador (BookingDrawer, ClientBookingFlow), e `window` sombrearia o
// objeto global do DOM dentro da função.
export function blockPosition(startIso: string, endIso: string, dayWindow: DayWindow) {
  const span = dayWindow.endMin - dayWindow.startMin;
  const start = Math.max(minutesSinceMidnight(startIso), dayWindow.startMin);
  const end = Math.min(minutesSinceMidnight(endIso), dayWindow.endMin);
  const top = ((start - dayWindow.startMin) / span) * 100;
  const height = ((end - start) / span) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 4)}%` };
}

export function hourMarks(dayWindow: DayWindow) {
  const marks: number[] = [];
  for (let m = dayWindow.startMin; m <= dayWindow.endMin; m += 60) marks.push(m);
  return marks;
}

export function minutesToLabel(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Lista de horários "redondos" (de stepMinutes em stepMinutes) dentro da
// janela recebida — usada pelo BookingDrawer e pelo ClientBookingFlow pra
// oferecer horários. Cada dia pode ter uma janela diferente agora, então
// isso precisa ser recalculado a cada troca de dia — não é mais uma lista
// fixa computada uma vez só.
export function generateSlotLabels(dayWindow: DayWindow, stepMinutes = 30) {
  const slots: string[] = [];
  for (let m = dayWindow.startMin; m < dayWindow.endMin; m += stepMinutes) {
    slots.push(minutesToLabel(m));
  }
  return slots;
}

// Um horário só é oferecível se o serviço couber antes do fechamento —
// sem isso, dava pra marcar às 22:50 um serviço de 40min que só termina
// depois da meia-noite.
export function slotFitsBeforeClosing(slotLabel: string, durationMinutes: number, dayWindow: DayWindow) {
  const [h, m] = slotLabel.split(":").map(Number);
  return h * 60 + m + durationMinutes <= dayWindow.endMin;
}

// Encaixa um instante (em minutos desde 00:00) na janela do dia sendo
// arrastado e arredonda para o múltiplo de `stepMinutes` mais próximo —
// usado pelo drag-and-drop da Agenda para transformar a posição Y do mouse
// num horário "limpo" (sem cair em 09:47, por exemplo).
export function clampAndSnapMinutes(minutes: number, durationMinutes: number, dayWindow: DayWindow, stepMinutes = 5) {
  const snapped = Math.round(minutes / stepMinutes) * stepMinutes;
  const maxStart = dayWindow.endMin - durationMinutes;
  return Math.min(Math.max(snapped, dayWindow.startMin), Math.max(maxStart, dayWindow.startMin));
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

/** Um horário só é oferecível pra esse profissional se não cair dentro de
 * nenhum bloqueio dele nesse dia — folga recorrente (mesmo dia da semana
 * toda semana, ex: almoço ou folga fixa) ou pontual (uma data específica,
 * ex: consulta médica). Ver migration 0012_professional_time_off.sql. Mesma
 * ideia de isSlotFree, mas contra bloqueios em vez de outros agendamentos —
 * as duas checagens rodam juntas no filtro de horários livres. */
export function isSlotBlocked(
  dateOnly: Date,
  slotLabel: string,
  durationMinutes: number,
  professionalId: string,
  timeOff: ProfessionalTimeOff[]
): boolean {
  const [h, m] = slotLabel.split(":").map(Number);
  const slotStart = h * 60 + m;
  const slotEnd = slotStart + durationMinutes;
  const weekday = dateOnly.getDay();
  const dateISO = formatLocalDateOnly(dateOnly);

  return timeOff.some((row) => {
    if (row.professionalId !== professionalId) return false;

    const matchesDay = row.kind === "recurring" ? row.weekday === weekday : row.date === dateISO;
    if (!matchesDay) return false;

    // Sem horário de início/fim = dia inteiro bloqueado.
    if (row.startTime === null || row.endTime === null) return true;

    const blockStart = parseTimeToMinutes(row.startTime);
    const blockEnd = parseTimeToMinutes(row.endTime);
    return slotStart < blockEnd && slotEnd > blockStart;
  });
}
