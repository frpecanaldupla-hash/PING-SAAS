"use client";

import { useState } from "react";
import type { Appointment, Client, Service } from "@/lib/types";
import { blockPosition, timeLabel } from "@/lib/agenda/time";
import { CompleteAppointmentModal } from "./CompleteAppointmentModal";

const STATUS_STYLE: Record<Appointment["status"], string> = {

const STATUS_STYLE: Record<Appointment["status"], string> = {
  scheduled: "bg-ink-800 border-ink-600 text-paper-50",
  checked_in: "bg-signal-500/15 border-signal-500/60 text-signal-400",
  in_progress: "bg-signal-500/25 border-signal-500 text-paper-50",
  completed: "bg-ink-800/60 border-ink-700 text-paper-500",
  no_show: "bg-danger/10 border-danger/40 text-danger",
  cancelled: "bg-ink-900 border-ink-800 text-paper-500 line-through",
};

// Só agendamentos ainda "em aberto" fazem sentido arrastar — um corte que já
// terminou ou foi cancelado não deveria poder ser movido de horário.
const DRAGGABLE_STATUSES: Appointment["status"][] = ["scheduled", "checked_in"];

export function AppointmentBlock({
  appointment,
  client,
  services,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  appointment: Appointment;
  client?: Pick<Client, "name">;
  services: Service[];
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, appointment: Appointment) => void;
  onDragEnd?: () => void;
}) {
  const { top, height } = blockPosition(appointment.startAt, appointment.endAt);
  const serviceNames = services
    .filter((s) => appointment.serviceIds.includes(s.id))
    .map((s) => s.name)
    .join(" + ");

  const [showModal, setShowModal] = useState(false);
const isDone = appointment.status === "completed" || appointment.status === "cancelled";
  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? (e) => onDragStart?.(e, appointment) : undefined}
      onDragEnd={onDragEnd}
      className={`absolute left-1 right-1 rounded-xs border px-2 py-1.5 overflow-hidden transition-all duration-150 ${STATUS_STYLE[appointment.status]} ${
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      } ${isDragging ? "opacity-30 border-dashed border-signal-500 scale-[0.98]" : "opacity-100"}`}
      style={{ top, height }}
      title={`${serviceNames} · ${client?.name ?? "Cliente"}${canDrag ? " · arraste para reagendar" : ""}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">
        {timeLabel(appointment.startAt)} · {client?.name ?? "Cliente"}
      </p>
      <p className="text-[11px] leading-tight truncate opacity-80">{serviceNames}</p>
      {!isDone && (
  <button
    onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
    className="mt-1 text-[10px] font-semibold text-signal-500 hover:text-signal-400"
  >
    Concluir
  </button>
)}

{showModal && (
        <CompleteAppointmentModal
          appointmentId={appointment.id}
          suggestedAmount={appointment.totalPrice}
          onClose={() => setShowModal(false)}
          onDone={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
