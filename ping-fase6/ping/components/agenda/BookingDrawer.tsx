"use client";

import { useState } from "react";
import { X, ArrowLeft, Plus, CheckCircle2 } from "lucide-react";
import type { Service, Professional } from "@/lib/types";

type Step = "service" | "time" | "confirm" | "done";

const TIME_SLOTS = ["09:00", "09:40", "10:30", "11:10", "14:00", "15:00", "16:30", "17:20"];

// Fluxo de agendamento: serviço → horário → confirmar = 3 toques no caminho feliz.
// O profissional já vem pré-selecionado (o próximo disponível); trocar de
// profissional é opcional e não conta contra o limite de 3 cliques.
export function BookingDrawer({
  services,
  professionals,
  autoOpen = false,
}: {
  services: Service[];
  professionals: Professional[];
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState<Step>("service");
  const [professional, setProfessional] = useState<Professional>(professionals[0]);
  const [service, setService] = useState<Service | null>(null);
  const [time, setTime] = useState<string | null>(null);

  function reset() {
    setStep("service");
    setService(null);
    setTime(null);
    setProfessional(professionals[0]);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

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
                    1 de 3 · Escolha o serviço
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
                    2 de 3 · Escolha o horário com {professional.name}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTime(t);
                          setStep("confirm");
                        }}
                        className="py-3 rounded-sm border border-ink-700 text-sm hover:bg-signal-500 hover:border-signal-500 hover:text-ink-950 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "confirm" && service && time && (
                <div className="animate-rise flex flex-col items-center text-center py-6">
                  <button
                    onClick={() => setStep("time")}
                    className="self-start mb-6 text-signal-500 text-sm flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Trocar horário
                  </button>
                  <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
                    3 de 3 · Confirmar
                  </p>
                  <p className="font-display text-3xl tracking-wide mb-2">{time}</p>
                  <p className="text-paper-400 mb-8">
                    {service.name} · {professional.name}
                  </p>
                  <button
                    onClick={() => setStep("done")}
                    className="w-full py-3.5 bg-signal-500 hover:bg-signal-400 text-ink-950 font-semibold rounded-sm transition-colors"
                  >
                    Confirmar agendamento
                  </button>
                </div>
              )}

              {step === "done" && service && time && (
                <div className="animate-rise flex flex-col items-center text-center py-10">
                  <CheckCircle2 size={64} className="text-signal-500 mb-5" />
                  <p className="font-display text-3xl tracking-wide mb-2">Agendado!</p>
                  <p className="text-paper-400 mb-8">
                    {service.name} às {time} com {professional.name}.
                    <br />
                    Lembrete enviado por WhatsApp.
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
