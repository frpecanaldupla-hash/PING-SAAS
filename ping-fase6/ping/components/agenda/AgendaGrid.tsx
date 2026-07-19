"use client";

import { useEffect, useState, useTransition } from "react";
import type { Appointment, Client, Professional, Service } from "@/lib/types";
import {
  hourMarks,
  minutesToLabel,
  AGENDA_START_MIN,
  AGENDA_END_MIN,
  AGENDA_SPAN_MIN,
} from "@/lib/agenda/time";
import { AppointmentBlock } from "./AppointmentBlock";
import { ProfessionalName } from "./ProfessionalName";
import { moveAppointment } from "@/app/agenda/actions";

// Converte a posição Y de onde o bloco foi solto (em px, relativa ao topo
// da coluna) num horário em minutos desde 00:00, arredondado pra grade de
// 15 em 15 — o mesmo tipo de precisão que faz sentido pra marcar hora num
// balcão de barbearia, sem exigir soltar o mouse no pixel exato.
function offsetYToMinutes(offsetY: number, columnHeight: number) {
  const ratio = Math.min(Math.max(offsetY / columnHeight, 0), 1);
  const raw = AGENDA_START_MIN + ratio * AGENDA_SPAN_MIN;
  const snapped = Math.round(raw / 15) * 15;
  return Math.min(Math.max(snapped, AGENDA_START_MIN), AGENDA_END_MIN - 15);
}

// "Hoje" no relógio do próprio navegador — igual ao BookingDrawer, sem
// precisar do truque de fuso horário de lib/time/brasilia.ts (aquele é só
// pra cálculo no servidor; no cliente, o computador do barbeiro já está no
// fuso certo).
function minutesToISO(totalMinutes: number) {
  const d = new Date();
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return d.toISOString();
}

export function AgendaGrid({
  professionals,
  appointments: appointmentsProp,
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

  // Estado local pra mover o bloco na hora (otimista) sem esperar a volta
  // do servidor — e voltar atrás sozinho se a Server Action recusar (ex:
  // horário ocupado por outro agendamento entre o momento do drag e o
  // drop). O useEffect resincroniza sempre que a page.tsx buscar dados
  // novos (revalidatePath depois de qualquer ação bem-sucedida).
  const [appointments, setAppointments] = useState(appointmentsProp);
  const [dragOverProfessionalId, setDragOverProfessionalId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [, startMove] = useTransition();

  useEffect(() => {
    setAppointments(appointmentsProp);
  }, [appointmentsProp]);

  function handleDrop(e: React.DragEvent<HTMLDivElement>, professionalId: string) {
    e.preventDefault();
    setDragOverProfessionalId(null);

    const id = e.dataTransfer.getData("text/plain");
    const original = appointments.find((a) => a.id === id);
    if (!original) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const durationMin = Math.max(
      15,
      Math.round((new Date(original.endAt).getTime() - new Date(original.startAt).getTime()) / 60000)
    );

    const startMin = offsetYToMinutes(offsetY, rect.height);
    const endMin = Math.min(startMin + durationMin, AGENDA_END_MIN);
    const startAt = minutesToISO(startMin);
    const endAt = minutesToISO(endMin);

    // Nada mudou (soltou na mesma coluna, no mesmo horário) — não vale a
    // pena nem chamar o servidor.
    if (professionalId === original.professionalId && startAt === original.startAt) {
      return;
    }

    const snapshot = appointments;
    setMoveError(null);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, professionalId, startAt, endAt } : a))
    );

    startMove(async () => {
      const result = await moveAppointment({ id, professionalId, startAt, endAt });
      if (result.error) {
        setAppointments(snapshot); // desfaz o otimismo — o servidor recusou
        setMoveError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {moveError && (
        <p className="text-danger text-xs px-1">{moveError}</p>
      )}

      <div className="ping-card overflow-hidden overflow-x-auto">
        {/* Cabeçalho: um profissional por coluna, como no Google Calendar */}
        <div
          className="grid border-b border-ink-800 min-w-[560px]"
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

        {/* Corpo: régua de horas + colunas com blocos posicionados em absoluto */}
        <div
          className="grid relative min-w-[560px]"
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
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverProfessionalId !== prof.id) setDragOverProfessionalId(prof.id);
              }}
              onDragLeave={(e) => {
                // Só limpa se realmente saiu da coluna (não de um filho pra
                // outro filho dentro dela) — evita o "piscar" do destaque.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverProfessionalId((current) => (current === prof.id ? null : current));
                }
              }}
              onDrop={(e) => handleDrop(e, prof.id)}
              className={`relative border-l transition-colors ${
                dragOverProfessionalId === prof.id
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
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
