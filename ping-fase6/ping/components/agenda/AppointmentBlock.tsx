"use client";

import { useState } from "react";
import type { Appointment, Client, Service } from "@/lib/types";
import { blockPosition, timeLabel } from "@/lib/agenda/time";

const STATUS_STYLE: Record<Appointment["status"], string> = {
  scheduled: "bg-ink-800 border-ink-600 text-paper-50",
  checked_in: "bg-signal-500/15 border-signal-500/60 text-signal-400",
  in_progress: "bg-signal-500/25 border-signal-500 text-paper-50",
  completed: "bg-ink-800/60 border-ink-700 text-paper-500",
  no_show: "bg-danger/10 border-danger/40 text-danger",
  cancelled: "bg-ink-900 border-ink-800 text-paper-500 line-through",
};

// Só faz sentido arrastar um agendamento que ainda vai acontecer — mover um
// "completed"/"cancelled"/"no_show" reescreveria um fato que já ocorreu.
const DRAGGABLE_STATUSES: Appointment["status"][] = ["scheduled", "checked_in", "in_progress"];

export function AppointmentBlock({
  appointment,
  client,
  services,
}: {
  appointment: Appointment;
  client?: Pick<Client, "name">;
  services: Service[];
}) {
  const [dragging, setDragging] = useState(false);
  const { top, height } = blockPosition(appointment.startAt, appointment.endAt);
  const serviceNames = services
    .filter((s) => appointment.serviceIds.includes(s.id))
    .map((s) => s.name)
    .join(" + ");

  const draggable = DRAGGABLE_STATUSES.includes(appointment.status);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        // Só precisa viajar o id — a AgendaGrid já tem o resto (horário
        // original, duração, profissional) no estado local, e recalcula o
        // novo horário a partir de onde o bloco foi solto.
        e.dataTransfer.setData("text/plain", appointment.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`absolute left-1 right-1 rounded-xs border px-2 py-1.5 overflow-hidden transition-opacity ${
        STATUS_STYLE[appointment.status]
      } ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${dragging ? "opacity-40 ring-2 ring-signal-500" : ""}`}
      style={{ top, height }}
      title={`${serviceNames} · ${client?.name ?? "Cliente"}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">
        {timeLabel(appointment.startAt)} · {client?.name ?? "Cliente"}
      </p>
      <p className="text-[11px] leading-tight truncate opacity-80">{serviceNames}</p>
    </div>
  );
}
