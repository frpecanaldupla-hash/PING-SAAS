"use client";

import { useEffect, useState, useTransition } from "react";
import { X, ArrowLeft, Plus, CheckCircle2, Search, UserPlus } from "lucide-react";
import type { Service, Professional, Appointment } from "@/lib/types";
import { createAppointment, searchClients } from "@/app/agenda/actions";
import { generateSlotLabels, slotFitsBeforeClosing } from "@/lib/agenda/time";

type Step = "service" | "time" | "client" | "confirm" | "done";
type FoundClient = { id: string; name: string; phone: string };

// Gerado a partir de AGENDA_START_MIN/AGENDA_END_MIN (lib/agenda/time.ts) —
// hoje é 07:00–23:00 de meia em meia hora. Mudar o horário de
// funcionamento do negócio é mudar só lá, não aqui.
const TIME_SLOTS = generateSlotLabels(30);

function timeSlotToISO(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function addMinutesISO(iso: string, minutes: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

// Um horário só aparece como escolhível se não colidir com nenhum
// agendamento existente (não cancelado) desse profissional. Isso é só
// ajuda visual — quem garante de verdade, contra corrida de duas abas
// confirmando ao mesmo tempo, é a checagem em createAppointment.
function isSlotFree(slot: string, durationMinutes: number, professionalId: string, appointments: Appointment[]) {
  const start = timeSlotToISO(slot);
  const end = addMinutesISO(start, durationMinutes);
  return !appointments.some(
    (a) =>
      a.professionalId === professionalId &&
      a.status !== "cancelled" &&
      a.startAt < end &&
      a.endAt > start
  );
}

// Fluxo de agendamento: serviço → horário → cliente → confirmar. O
// profissional já vem pré-selecionado (o primeiro da lista); trocar de
// profissional é opcional e não conta contra o número de passos.
export function BookingDrawer({
  services,
  professionals,
  appointments,
  autoOpen = false,
}: {
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState<Step>("service");
  const [professional, setProfessional] = useState<Professional>(professionals[0]);
  const [service, setService] = useState<Service | null>(null);
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

  function reset() {
    setStep("service");
    setService(null);
    setTime(null);
    setProfessional(professionals[0]);
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

    const startAt = timeSlotToISO(time);
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold px-4 py-2.5 rounded-sm transition-colors text-sm"
      >
        <Plus size={16} />
        Novo agendamento
      </button>

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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors ${
                    professional.id === p.id
                      ? "bg-signal-500 border-signal-500 text-ink-950"
                      : "border-ink-700 text-paper-400 hover:text-paper-50"
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
                    2 de 4 · Escolha o horário com {professional.name}
                  </p>
                  {(() => {
                    const freeSlots = TIME_SLOTS.filter(
                      (t) =>
                        slotFitsBeforeClosing(t, service.durationMinutes) &&
                        isSlotFree(t, service.durationMinutes, professional.id, appointments)
                    );
                    if (freeSlots.length === 0) {
                      return (
                        <p className="text-sm text-paper-400">
                          Nenhum horário livre hoje com {professional.name} pra esse serviço.
                          Tenta outro profissional ali em cima.
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
                  })()}
                </div>
              )}

              {step === "client" && (
                <div className="animate-rise">
                  <button
                    onClick={() => setStep("time")}
                    className="mb-4 text-signal-500 text-sm flex items-center gap-1"
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
                        <input
                          autoFocus
                          value={clientQuery}
                          onChange={(e) => setClientQuery(e.target.value)}
                          placeholder="Nome ou telefone"
                          className="w-full bg-ink-800 border border-ink-700 rounded-sm pl-9 pr-3 py-3 text-sm focus:border-signal-500 outline-none"
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
                                className="w-full text-left px-4 py-3 ping-card hover:border-signal-500/50 transition-colors flex justify-between items-center"
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
                        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-ink-700 rounded-sm text-sm text-paper-400 hover:text-paper-50 hover:border-ink-600 transition-colors"
                      >
                        <UserPlus size={15} /> Cadastrar cliente novo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        autoFocus
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nome do cliente"
                        className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
                      />
                      <input
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value.replace(/[^\d()\-\s]/g, ""))}
                        placeholder="Telefone (WhatsApp)"
                        inputMode="tel"
                        className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCreatingClient(false)}
                          className="flex-1 py-2.5 border border-ink-700 rounded-sm text-sm text-paper-400 hover:text-paper-50 transition-colors"
                        >
                          Voltar pra busca
                        </button>
                        <button
                          onClick={useNewClient}
                          disabled={!newClientName.trim() || newClientPhone.replace(/\D/g, "").length < 8}
                          className="flex-1 py-2.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-50 text-ink-950 font-semibold rounded-sm text-sm transition-colors"
                        >
                          Usar esse cliente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "confirm" && service && time && (
                <div className="animate-rise flex flex-col items-center text-center py-6">
                  <button
                    onClick={() => setStep("client")}
                    className="self-start mb-6 text-signal-500 text-sm flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Trocar cliente
                  </button>
                  <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
                    4 de 4 · Confirmar
                  </p>
                  <p className="font-display text-3xl tracking-wide mb-2">{time}</p>
                  <p className="text-paper-400 mb-1">
                    {service.name} · {professional.name}
                  </p>
                  <p className="text-paper-50 font-semibold mb-8">{clientLabel}</p>

                  {saveError && (
                    <p className="text-danger text-xs mb-4">{saveError}</p>
                  )}

                  <button
                    onClick={confirmAppointment}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm transition-colors"
                  >
                    {isSaving ? "Salvando..." : "Confirmar agendamento"}
                  </button>
                </div>
              )}

              {step === "done" && service && time && (
                <div className="animate-rise flex flex-col items-center text-center py-10">
                  <CheckCircle2 size={64} className="text-signal-500 mb-5" />
                  <p className="font-display text-3xl tracking-wide mb-2">Agendado!</p>
                  <p className="text-paper-400 mb-8">
                    {service.name} às {time} com {professional.name}
                    {clientLabel ? ` para ${clientLabel}` : ""}.
                  </p>
                  <button
                    onClick={close}
                    className="w-full py-3.5 border border-ink-700 hover:border-paper-500 rounded-sm transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
