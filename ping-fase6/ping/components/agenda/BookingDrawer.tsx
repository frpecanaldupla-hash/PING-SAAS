"use client";

import { useEffect, useState, useTransition } from "react";
import { X, ArrowLeft, Plus, CheckCircle2, Search, UserPlus } from "lucide-react";
import type { Service, Professional, Appointment } from "@/lib/types";
import { createAppointment, searchClients, getDayAppointments } from "@/app/agenda/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

type Step = "service" | "time" | "client" | "confirm" | "done";
type FoundClient = { id: string; name: string; phone: string };
type DayAppointment = Pick<Appointment, "professionalId" | "status" | "startAt" | "endAt">;

// Gerado a partir de AGENDA_START_MIN/AGENDA_END_MIN (lib/agenda/time.ts) —
// hoje é 07:00–23:00 de meia em meia hora. Mudar o horário de
// funcionamento do negócio é mudar só lá, não aqui.
const TIME_SLOTS = generateSlotLabels(30);
const BOOKABLE_DAYS = nextNDays(14);

// Fluxo de agendamento: serviço → data/horário → cliente → confirmar. O
// profissional já vem pré-selecionado (o primeiro da lista); trocar de
// profissional é opcional e não conta contra o número de passos.
export function BookingDrawer({
  services,
  professionals,
  appointments,
  initialDate,
  autoOpen = false,
}: {
  services: Service[];
  professionals: Professional[];
  /** Agendamentos do dia que a Agenda está mostrando agora (mesmo dia de `initialDate`) — usado como ponto de partida antes de qualquer troca de dia dentro do drawer. */
  appointments: Appointment[];
  /** "YYYY-MM-DD" do dia que a Agenda está mostrando agora — vira o dia pré-selecionado ao abrir um novo agendamento. Sem isso, cai em hoje. */
  initialDate?: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState<Step>("service");
  const [professional, setProfessional] = useState<Professional>(professionals[0]);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    initialDate ? parseLocalDateOnly(initialDate) : BOOKABLE_DAYS[0]
  );
  const [dayAppointments, setDayAppointments] = useState<DayAppointment[]>(appointments);
  const [time, setTime] = useState<string | null>(null);

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<FoundClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<FoundClient | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [draftClient, setDraftClient] = useState<{ name: string; phone: string } | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [isLoadingDay, startLoadDay] = useTransition();

  // Busca com um pequeno debounce — evita disparar uma Server Action a
  // cada tecla digitada.
  useEffect(() => {
    if (clientQuery.trim().length < 2) {
      setClientResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        const { clients } = await searchClients(clientQuery);
        setClientResults(clients);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [clientQuery]);

  // Troca de dia dentro do drawer: os agendamentos recebidos por prop são
  // só do dia que a Agenda está mostrando — qualquer outro dia escolhido
  // aqui precisa buscar de novo, senão a pré-visualização de horário livre
  // mostraria tudo como livre (nenhum agendamento carregado bate com esse
  // dia). É só ajuda visual — createAppointment garante de verdade.
  function pickDate(date: Date) {
    setSelectedDate(date);
    setTime(null);
    startLoadDay(async () => {
      const { appointments: fresh } = await getDayAppointments(formatLocalDateOnly(date));
      setDayAppointments(fresh);
    });
  }

  function reset() {
    setStep("service");
    setService(null);
    setTime(null);
    setProfessional(professionals[0]);
    setSelectedDate(initialDate ? parseLocalDateOnly(initialDate) : BOOKABLE_DAYS[0]);
    setDayAppointments(appointments);
    setClientQuery("");
    setClientResults([]);
    setSelectedClient(null);
    setCreatingClient(false);
    setNewClientName("");
    setNewClientPhone("");
    setDraftClient(null);
    setSaveError(null);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  function pickExistingClient(c: FoundClient) {
    setSelectedClient(c);
    setDraftClient(null);
    setStep("confirm");
  }

  function useNewClient() {
    if (!newClientName.trim() || newClientPhone.replace(/\D/g, "").length < 8) return;
    setDraftClient({ name: newClientName.trim(), phone: newClientPhone });
    setSelectedClient(null);
    setStep("confirm");
  }

  function confirmAppointment() {
    if (!service || !time) return;
    setSaveError(null);

    const startAt = slotToISO(selectedDate, time);
    const endAt = addMinutesISO(startAt, service.durationMinutes);

    startSave(async () => {
      const result = await createAppointment({
        professionalId: professional.id,
        serviceIds: [service.id],
        startAt,
        endAt,
        totalPrice: service.price,
        clientId: selectedClient?.id,
        newClient: draftClient ?? undefined,
      });

      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setStep("done");
    });
  }

  const clientLabel = selectedClient?.name ?? draftClient?.name ?? null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        Novo agendamento
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Fechar"
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm bg-ink-950 border-l border-ink-800 h-full flex flex-col animate-rise">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
              <p className="font-display text-2xl tracking-wide">Novo agendamento</p>
              <button onClick={close} className="text-paper-500 hover:text-paper-50">
                <X size={20} />
              </button>
            </div>

            {/* Profissional — pré-selecionado, trocável a qualquer momento */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-ink-800 overflow-x-auto">
              {professionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfessional(p)}
                  className={`px-3 py-1.5 rounded-full text-xs border shrink-0 transition-all ${
                    professional.id === p.id
                      ? "bg-gradient-to-br from-signal-400 to-signal-500 border-transparent text-ink-950 font-semibold shadow-[0_0_16px_rgba(232,67,47,0.35)]"
                      : "border-ink-700 text-paper-400 font-medium hover:text-paper-50 hover:border-paper-500"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
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
                    2 de 4 · Escolha o dia e o horário com {professional.name}
                  </p>

                  {/* Chips roláveis com os próximos 14 dias — escolher um dia
                      diferente de hoje busca de novo os horários ocupados
                      desse dia (ver pickDate). */}
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
                      const freeSlots = TIME_SLOTS.filter(
                        (t) =>
                          slotFitsBeforeClosing(t, service.durationMinutes) &&
                          isSlotFree(selectedDate, t, service.durationMinutes, professional.id, dayAppointments)
                      );
                      if (freeSlots.length === 0) {
                        return (
                          <p className="text-sm text-paper-400">
                            Nenhum horário livre com {professional.name} pra esse serviço nesse dia.
                            Tenta outro profissional ali em cima ou outro dia.
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
                                setStep("client");
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

              {step === "client" && (
                <div className="animate-rise">
                  <button
                    onClick={() => setStep("time")}
                    className="mb-4 text-signal-400 hover:text-signal-300 transition-colors text-sm flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Trocar horário
                  </button>
                  <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">
                    3 de 4 · Quem é o cliente?
                  </p>

                  {!creatingClient ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
                        <Input
                          autoFocus
                          value={clientQuery}
                          onChange={(e) => setClientQuery(e.target.value)}
                          placeholder="Nome ou telefone"
                          className="pl-9"
                        />
                      </div>

                      {isSearching && (
                        <p className="text-xs text-paper-500">Buscando...</p>
                      )}

                      {clientResults.length > 0 && (
                        <ul className="space-y-1.5">
                          {clientResults.map((c) => (
                            <li key={c.id}>
                              <button
                                onClick={() => pickExistingClient(c)}
                                className="w-full text-left px-4 py-3 ping-card hover:border-signal-400/40 transition-all flex justify-between items-center"
                              >
                                <span className="text-sm font-medium">{c.name}</span>
                                <span className="text-xs text-paper-500">{c.phone}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {clientQuery.trim().length >= 2 && !isSearching && clientResults.length === 0 && (
                        <p className="text-xs text-paper-500">Nenhum cliente encontrado com esse nome ou telefone.</p>
                      )}

                      <button
                        onClick={() => {
                          setCreatingClient(true);
                          setNewClientName(clientQuery.trim());
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-ink-700 rounded-sm text-sm text-paper-400 hover:text-paper-50 hover:border-signal-400/40 transition-colors"
                      >
                        <UserPlus size={15} /> Cadastrar cliente novo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        autoFocus
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nome do cliente"
                      />
                      <Input
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value.replace(/[^\d()\-\s]/g, ""))}
                        placeholder="Telefone (WhatsApp)"
                        inputMode="tel"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCreatingClient(false)}
                          className="flex-1"
                        >
                          Voltar pra busca
                        </Button>
                        <Button
                          onClick={useNewClient}
                          disabled={!newClientName.trim() || newClientPhone.replace(/\D/g, "").length < 8}
                          className="flex-1"
                        >
                          Usar esse cliente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "confirm" && service && time && (
                <div className="animate-rise flex flex-col items-center text-center py-6">
                  <button
                    onClick={() => setStep("client")}
                    className="self-start mb-6 text-signal-400 hover:text-signal-300 transition-colors text-sm flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Trocar cliente
                  </button>
                  <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
                    4 de 4 · Confirmar
                  </p>
                  <p className="text-xs text-paper-500 mb-1">{dayChipLabel(selectedDate)}</p>
                  <p className="font-display text-3xl tracking-wide mb-2">{time}</p>
                  <p className="text-paper-400 mb-1">
                    {service.name} · {professional.name}
                  </p>
                  <p className="text-paper-50 font-semibold mb-8">{clientLabel}</p>

                  {saveError && (
                    <p className="text-danger text-xs mb-4">{saveError}</p>
                  )}

                  <Button
                    size="lg"
                    onClick={confirmAppointment}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? "Salvando..." : "Confirmar agendamento"}
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
                    {service.name} · {dayChipLabel(selectedDate).toLowerCase()} às {time} com {professional.name}
                    {clientLabel ? ` para ${clientLabel}` : ""}.
                  </p>
                  <Button size="lg" variant="outline" onClick={close} className="w-full">
                    Fechar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
