"use client";

import { useState, useTransition } from "react";
import type { Appointment, Client, Professional, Service } from "@/lib/types";
import {
  hourMarks,
  minutesToLabel,
  AGENDA_START_MIN,
  AGENDA_SPAN_MIN,
  clampAndSnapMinutes,
} from "@/lib/agenda/time";
import { AppointmentBlock } from "./AppointmentBlock";
import { ProfessionalName } from "./ProfessionalName";
import { moveAppointment } from "@/app/agenda/actions";

export function AgendaGrid({
  professionals,
  appointments,
  clients,
  services,
  currentUserId,
}: {
  professionals: Professional[];
  appointments: Appointment[];
  clients: Pick<Client, "id" | "name">[];
  services: Service[];
  currentUserId?: string;
}) {
  const marks = hourMarks();
  const rowCount = marks.length - 1;

  // Estado do drag-and-drop vive aqui, no componente pai, porque tanto o
  // bloco arrastado (precisa ficar semitransparente) quanto a coluna de
  // destino (precisa da borda destacada) reagem ao mesmo gesto.
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverProfessionalId, setHoverProfessionalId] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [isMoving, startMove] = useTransition();

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, appointment: Appointment) {
    setDraggedId(appointment.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appointment.id);
    const durationMin = Math.round(
      (new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60000
    );
    e.dataTransfer.setData("application/x-duration-min", String(durationMin));
  }

  function handleDragEnd() {
    setDraggedId(null);
    setHoverProfessionalId(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, professionalId: string) {
    e.preventDefault(); // obrigatório: sem isso o navegador recusa o drop
    e.dataTransfer.dropEffect = "move";
    if (hoverProfessionalId !== professionalId) setHoverProfessionalId(professionalId);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>, professionalId: string) {
    // dragleave dispara toda vez que o mouse passa por cima de um filho
    // (linha de hora, bloco de agendamento) — sem esse checkOf `relatedTarget`,
    // a borda de destaque pisca o tempo todo enquanto arrasta dentro da
    // mesma coluna.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setHoverProfessionalId((curr) => (curr === professionalId ? null : curr));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, professionalId: string) {
    e.preventDefault();
    setHoverProfessionalId(null);
    setDraggedId(null);

    const appointmentId = e.dataTransfer.getData("text/plain");
    const durationMin = Number(e.dataTransfer.getData("application/x-duration-min"));
    if (!appointmentId || !durationMin) return;

    // Converte a posição Y do mouse dentro da coluna em minutos desde
    // 00:00, dentro da janela de funcionamento — mesma lógica inversa de
    // blockPosition() em lib/agenda/time.ts.
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const rawMinutes = AGENDA_START_MIN + Math.min(Math.max(ratio, 0), 1) * AGENDA_SPAN_MIN;
    const startMinutes = clampAndSnapMinutes(rawMinutes, durationMin);

    const startDate = new Date();
    startDate.setHours(0, startMinutes, 0, 0); // o overflow de minutos vira hora sozinho
    const startAt = startDate.toISOString();
    const endAt = new Date(startDate.getTime() + durationMin * 60000).toISOString();

    startMove(async () => {
      const result = await moveAppointment({ id: appointmentId, professionalId, startAt, endAt });
      if (result.error) {
        setDragError(result.error);
        setTimeout(() => setDragError(null), 3500);
      }
    });
  }

  return (
    <div className="ping-card overflow-hidden relative">
      {dragError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-danger text-white text-xs font-medium px-3 py-2 rounded-sm shadow-lg animate-rise">
          {dragError}
        </div>
      )}
      {isMoving && (
        <div className="absolute top-2 right-2 z-10 bg-ink-800 text-paper-300 text-[11px] font-medium px-2.5 py-1.5 rounded-sm">
          Movendo...
        </div>
      )}

      {/* Cabeçalho: um profissional por coluna, como no Google Calendar */}
      <div
        className="grid border-b border-ink-800"
        style={{ gridTemplateColumns: `56px repeat(${professionals.length}, 1fr)` }}
      >
        <div />
        {professionals.map((p) => (
          <div key={p.id} className="px-3 py-3 text-center border-l border-ink-800">
            {/* O lápis de editar só aparece no chip do profissional logado
                — os demais membros da equipe são só leitura por aqui, isso
                é trabalho da tela de Equipe (ainda no mock). */}
            {p.userId === currentUserId ? (
              <div className="flex justify-center">
                <ProfessionalName id={p.id} name={p.name} />
              </div>
            ) : (
              <p className="text-sm font-semibold truncate">{p.name}</p>
            )}
          </div>
        ))}
      </div>

      {/* Corpo: régua de horas + colunas com blocos posicionados em absoluto.
          Cada coluna é uma zona de drop — arraste um bloco (de qualquer
          profissional) pra cima dela pra reagendar horário e/ou trocar de
          profissional numa tacada só. */}
      <div
        className="grid relative"
        style={{ gridTemplateColumns: `56px repeat(${professionals.length}, 1fr)` }}
      >
        <div className="relative">
          {marks.slice(0, -1).map((m) => (
            <div
              key={m}
              className="h-16 text-[11px] text-paper-500 text-right pr-2 -translate-y-2"
            >
              {minutesToLabel(m)}
            </div>
          ))}
        </div>

        {professionals.map((prof) => (
          <div
            key={prof.id}
            onDragOver={(e) => handleDragOver(e, prof.id)}
            onDragLeave={(e) => handleDragLeave(e, prof.id)}
            onDrop={(e) => handleDrop(e, prof.id)}
            className={`relative border-l transition-colors duration-150 ${
              hoverProfessionalId === prof.id
                ? "border-signal-500 bg-signal-500/5"
                : "border-ink-800"
            }`}
          >
            {/* linhas horizontais de hora, puramente decorativas */}
            {Array.from({ length: rowCount }).map((_, i) => (
              <div key={i} className="h-16 border-b border-ink-800/60" />
            ))}

            <div className="absolute inset-0">
              {appointments
                .filter((a) => a.professionalId === prof.id)
                .map((a) => (
                  <AppointmentBlock
                    key={a.id}
                    appointment={a}
                    client={clients.find((c) => c.id === a.clientId)}
                    services={services}
                    isDragging={draggedId === a.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
