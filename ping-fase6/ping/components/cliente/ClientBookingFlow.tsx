"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Service, Appointment } from "@/lib/types";
import { createMyAppointment, getAvailability } from "@/app/cliente/agendar/actions";
import {
  generateSlotLabels,
  slotFitsBeforeClosing,
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

const TIME_SLOTS = generateSlotLabels(30);
const BOOKABLE_DAYS = nextNDays(14);

// Fluxo de agendamento da Área do Cliente: serviço → dia/horário →
// observação → confirmar. De propósito SEM passo de escolher profissional
// (o cliente logado não deveria ver a equipe em detalhe) — pro horário
// escolhido, usa o primeiro profissional ativo que estiver livre; quem
// atende de fato o dono decide na Agenda, isso aqui só reserva o horário.
export function ClientBookingFlow({
  services,
  professionalIds,
  initialDate,
  initialAppointments,
}: {
  services: Service[];
  professionalIds: string[];
  /** "YYYY-MM-DD" de hoje, calculado no servidor (Brasília) — ponto de partida dos chips de dia. */
  initialDate: string;
  initialAppointments: DayAppointment[];
}) {
  const [step, setStep] = useState<Step>("service");
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
    return professionalIds.find((id) => isSlotFree(selectedDate, slot, durationMinutes, id, dayAppointments)) ?? null;
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
    <div className="ping-card p-6">
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
              className="w-full text-left p-4 ping-card hover:border-signal-500/50 transition-colors flex justify-between items-center"
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
            className="mb-4 text-signal-500 text-sm flex items-center gap-1"
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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isSelected
                      ? "bg-signal-500 border-signal-500 text-ink-950"
                      : "border-ink-700 text-paper-400 hover:text-paper-50"
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
              const freeSlots = TIME_SLOTS.filter(
                (t) =>
                  slotFitsBeforeClosing(t, service.durationMinutes) &&
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
            className="mb-4 text-signal-500 text-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Trocar horário
          </button>
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">
            3 de 4 · Alguma observação?
          </p>
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 280))}
            placeholder="Opcional — ex: corte igual da última vez"
            rows={4}
            className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none resize-none mb-4"
          />
          <button
            onClick={() => setStep("confirm")}
            className="w-full py-3 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold rounded-sm text-sm transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {step === "confirm" && service && time && (
        <div className="animate-rise flex flex-col items-center text-center py-6">
          <button
            onClick={() => setStep("notes")}
            className="self-start mb-6 text-signal-500 text-sm flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">4 de 4 · Confirmar</p>
          <p className="text-xs text-paper-500 mb-1">{dayChipLabel(selectedDate)}</p>
          <p className="font-display text-3xl tracking-wide mb-2">{time}</p>
          <p className="text-paper-400 mb-1">{service.name}</p>
          {notes && <p className="text-paper-500 text-xs mb-6 max-w-xs">&ldquo;{notes}&rdquo;</p>}

          {saveError && <p className="text-danger text-xs mb-4">{saveError}</p>}

          <button
            onClick={confirm}
            disabled={isSaving}
            className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors mt-2"
          >
            {isSaving ? "Agendando..." : "Confirmar agendamento"}
          </button>
        </div>
      )}

      {step === "done" && service && time && (
        <div className="animate-rise flex flex-col items-center text-center py-10">
          <CheckCircle2 size={64} className="text-signal-500 mb-5" />
          <p className="font-display text-3xl tracking-wide mb-2">Agendado!</p>
          <p className="text-paper-400 mb-8">
            {service.name} · {dayChipLabel(selectedDate).toLowerCase()} às {time}.
          </p>
          <a
            href="/cliente"
            className="w-full py-3.5 border border-ink-700 hover:border-paper-500 rounded-sm transition-colors block"
          >
            Voltar pra sua área
          </a>
        </div>
      )}
    </div>
  );
}
