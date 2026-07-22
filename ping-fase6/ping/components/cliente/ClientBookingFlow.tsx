"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Service, Appointment, BusinessHours, Professional, ProfessionalTimeOff } from "@/lib/types";
import { createMyAppointment, getAvailability } from "@/app/cliente/agendar/actions";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import {
  generateSlotLabels,
  slotFitsBeforeClosing,
  getDayWindow,
  isSlotBlocked,
  nextNDays,
  dayChipLabel,
  parseLocalDateOnly,
  formatLocalDateOnly,
  slotToISO,
  addMinutesISO,
  isSlotFree,
} from "@/lib/agenda/time";

type Step = "service" | "time" | "notes" | "confirm" | "done";
type DayAppointment = Pick<Appointment, "professionalId" | "status" | "startAt" | "endAt">;

const BOOKABLE_DAYS = nextNDays(14);

type ChosenProfessional = Pick<Professional, "id" | "name">;

// Fluxo de agendamento da Área do Cliente: serviço → dia/horário →
// observação → confirmar. Escolher profissional é opcional (chip bar acima
// dos passos, mesmo padrão do BookingDrawer da equipe) — "Sem preferência"
// é o padrão e preserva o comportamento antigo: usa o primeiro profissional
// ativo que estiver livre no horário escolhido.
export function ClientBookingFlow({
  services,
  professionals,
  businessHours,
  professionalTimeOff,
  initialDate,
  initialAppointments,
}: {
  services: Service[];
  professionals: ChosenProfessional[];
  /** As 7 linhas de horário de funcionamento do negócio (ver migration 0011_business_hours.sql). */
  businessHours: BusinessHours[];
  /** Folgas/bloqueios de cada profissional (ver migration 0012_professional_time_off.sql) — um profissional bloqueado nesse horário não entra na escolha automática/manual abaixo. */
  professionalTimeOff: ProfessionalTimeOff[];
  /** "YYYY-MM-DD" de hoje, calculado no servidor (Brasília) — ponto de partida dos chips de dia. */
  initialDate: string;
  initialAppointments: DayAppointment[];
}) {
  const [step, setStep] = useState<Step>("service");
  // null = "Sem preferência" — o padrão. Um profissional específico aqui
  // restringe firstFreeProfessional a só ele, em vez de escolher entre todos.
  const [professional, setProfessional] = useState<ChosenProfessional | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseLocalDateOnly(initialDate));
  const [dayAppointments, setDayAppointments] = useState<DayAppointment[]>(initialAppointments);
  const [time, setTime] = useState<string | null>(null);
  const [chosenProfessionalId, setChosenProfessionalId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isLoadingDay, startLoadDay] = useTransition();

  function pickDate(date: Date) {
    setSelectedDate(date);
    setTime(null);
    startLoadDay(async () => {
      const { appointments } = await getAvailability(formatLocalDateOnly(date));
      setDayAppointments(appointments);
    });
  }

  function firstFreeProfessional(slot: string, durationMinutes: number) {
    const candidateIds = professional ? [professional.id] : professionals.map((p) => p.id);
    return (
      candidateIds.find(
        (id) =>
          isSlotFree(selectedDate, slot, durationMinutes, id, dayAppointments) &&
          !isSlotBlocked(selectedDate, slot, durationMinutes, id, professionalTimeOff)
      ) ?? null
    );
  }

  function confirm() {
    if (!service || !time || !chosenProfessionalId) return;
    setSaveError(null);

    const startAt = slotToISO(selectedDate, time);
    const endAt = addMinutesISO(startAt, service.durationMinutes);

    startSave(async () => {
      const result = await createMyAppointment({
        professionalId: chosenProfessionalId,
        serviceId: service.id,
        startAt,
        endAt,
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setStep("done");
    });
  }

  return (
    <Card className="p-6">
      {/* Escolha de profissional — só faz sentido mostrar se houver mais de
          um; com um único profissional ativo não existe escolha real, e
          "Sem preferência" sozinho ao lado do nome dele só confundiria. */}
      {professionals.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 -mx-1 px-1 border-b border-ink-800">
          <button
            onClick={() => setProfessional(null)}
            className={`px-3 py-1.5 rounded-full text-xs border shrink-0 transition-all ${
              professional === null
                ? "bg-gradient-to-br from-signal-400 to-signal-500 border-transparent text-ink-950 font-semibold shadow-[0_0_16px_rgba(232,67,47,0.35)]"
                : "border-ink-700 text-paper-400 font-medium hover:text-paper-50 hover:border-paper-500"
            }`}
          >
            Sem preferência
          </button>
          {professionals.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfessional(p)}
              className={`px-3 py-1.5 rounded-full text-xs border shrink-0 transition-all ${
                professional?.id === p.id
                  ? "bg-gradient-to-br from-signal-400 to-signal-500 border-transparent text-ink-950 font-semibold shadow-[0_0_16px_rgba(232,67,47,0.35)]"
                  : "border-ink-700 text-paper-400 font-medium hover:text-paper-50 hover:border-paper-500"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {step === "service" && (
        <div className="space-y-3 animate-rise">
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-1">
            1 de 4 · Escolha o serviço
          </p>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setService(s);
                setStep("time");
              }}
              className="w-full text-left p-4 ping-card hover:border-signal-400/40 hover:-translate-y-0.5 transition-all flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-paper-500">{s.durationMinutes} min</p>
              </div>
              <p className="ping-figure text-sm font-semibold text-brass-400">
                R$ {s.price.toFixed(0)}
              </p>
            </button>
          ))}
        </div>
      )}

      {step === "time" && service && (
        <div className="animate-rise">
          <button
            onClick={() => setStep("service")}
            className="mb-4 text-signal-400 hover:text-signal-300 transition-colors text-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Trocar serviço
          </button>
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">
            2 de 4 · Escolha o dia e o horário
          </p>

          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
            {BOOKABLE_DAYS.map((d) => {
              const isSelected = formatLocalDateOnly(d) === formatLocalDateOnly(selectedDate);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => pickDate(d)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    isSelected
                      ? "bg-gradient-to-br from-signal-400 to-signal-500 border-transparent text-ink-950 font-semibold shadow-[0_0_16px_rgba(232,67,47,0.35)]"
                      : "border-ink-700 text-paper-400 font-medium hover:text-paper-50 hover:border-paper-500"
                  }`}
                >
                  {dayChipLabel(d)}
                </button>
              );
            })}
          </div>

          {isLoadingDay ? (
            <p className="text-xs text-paper-500">Carregando horários...</p>
          ) : (
            (() => {
              const dayWindow = getDayWindow(businessHours, selectedDate);
              if (dayWindow.closed) {
                return (
                  <p className="text-sm text-paper-400">
                    Fechado nesse dia. Escolha outro dia ali em cima.
                  </p>
                );
              }
              const daySlots = generateSlotLabels(dayWindow, 30);
              const freeSlots = daySlots.filter(
                (t) =>
                  slotFitsBeforeClosing(t, service.durationMinutes, dayWindow) &&
                  firstFreeProfessional(t, service.durationMinutes) !== null
              );
              if (freeSlots.length === 0) {
                return (
                  <p className="text-sm text-paper-400">
                    Nenhum horário livre pra esse serviço nesse dia. Tenta outro dia.
                  </p>
                );
              }
              return (
                <div className="grid grid-cols-4 gap-2">
                  {freeSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTime(t);
                        setChosenProfessionalId(firstFreeProfessional(t, service.durationMinutes));
                        setStep("notes");
                      }}
                      className="py-2.5 rounded-sm border border-ink-700 text-sm hover:bg-signal-500 hover:border-signal-500 hover:text-ink-950 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {step === "notes" && service && time && (
        <div className="animate-rise">
          <button
            onClick={() => setStep("time")}
            className="mb-4 text-signal-400 hover:text-signal-300 transition-colors text-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Trocar horário
          </button>
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">
            3 de 4 · Alguma observação?
          </p>
          <div className="mb-4">
            <Textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 280))}
              placeholder="Opcional — ex: corte igual da última vez"
              rows={4}
            />
          </div>
          <Button onClick={() => setStep("confirm")} className="w-full">
            Continuar
          </Button>
        </div>
      )}

      {step === "confirm" && service && time && (
        <div className="animate-rise flex flex-col items-center text-center py-6">
          <button
            onClick={() => setStep("notes")}
            className="self-start mb-6 text-signal-400 hover:text-signal-300 transition-colors text-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">4 de 4 · Confirmar</p>
          <p className="text-xs text-paper-500 mb-1">{dayChipLabel(selectedDate)}</p>
          <p className="font-display text-3xl tracking-wide mb-2">{time}</p>
          <p className="text-paper-400 mb-1">
            {service.name}
            {professional ? ` · ${professional.name}` : ""}
          </p>
          {notes && <p className="text-paper-500 text-xs mb-6 max-w-xs">&ldquo;{notes}&rdquo;</p>}

          {saveError && <p className="text-danger text-xs mb-4">{saveError}</p>}

          <Button size="lg" onClick={confirm} disabled={isSaving} className="w-full mt-2">
            {isSaving ? "Agendando..." : "Confirmar agendamento"}
          </Button>
        </div>
      )}

      {step === "done" && service && time && (
        <div className="animate-rise flex flex-col items-center text-center py-10">
          <CheckCircle2
            size={64}
            className="text-signal-400 mb-5 drop-shadow-[0_0_18px_rgba(255,91,61,0.5)]"
          />
          <p className="font-display text-3xl tracking-wide mb-2">Agendado!</p>
          <p className="text-paper-400 mb-8">
            {service.name} · {dayChipLabel(selectedDate).toLowerCase()} às {time}
            {professional ? ` com ${professional.name}` : ""}.
          </p>
          {/* <a> de propósito (não next/link): recarrega a página inteira e
              garante que /cliente volte com os dados frescos do agendamento. */}
          <a
            href="/cliente"
            className={buttonClasses({ variant: "outline", size: "lg", className: "w-full" })}
          >
            Voltar pra sua área
          </a>
        </div>
      )}
    </Card>
  );
}
