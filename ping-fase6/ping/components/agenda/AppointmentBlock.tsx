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

export function AppointmentBlock({
  appointment,
  client,
  services,
}: {
  appointment: Appointment;
  client?: Client;
  services: Service[];
}) {
  const { top, height } = blockPosition(appointment.startAt, appointment.endAt);
  const serviceNames = services
    .filter((s) => appointment.serviceIds.includes(s.id))
    .map((s) => s.name)
    .join(" + ");

  return (
    <div
      className={`absolute left-1 right-1 rounded-xs border px-2 py-1.5 overflow-hidden ${STATUS_STYLE[appointment.status]}`}
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
