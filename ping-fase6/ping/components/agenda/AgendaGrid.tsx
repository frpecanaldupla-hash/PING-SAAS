import type { Appointment, Client, Professional, Service } from "@/lib/types";
import { hourMarks, minutesToLabel, AGENDA_START_MIN, AGENDA_END_MIN } from "@/lib/agenda/time";
import { AppointmentBlock } from "./AppointmentBlock";

export function AgendaGrid({
  professionals,
  appointments,
  clients,
  services,
}: {
  professionals: Professional[];
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
}) {
  const marks = hourMarks();
  const rowCount = marks.length - 1;

  return (
    <div className="ping-card overflow-hidden">
      {/* Cabeçalho: um profissional por coluna, como no Google Calendar */}
      <div
        className="grid border-b border-ink-800"
        style={{ gridTemplateColumns: `56px repeat(${professionals.length}, 1fr)` }}
      >
        <div />
        {professionals.map((p) => (
          <div key={p.id} className="px-3 py-3 text-center border-l border-ink-800">
            <p className="text-sm font-semibold truncate">{p.name}</p>
          </div>
        ))}
      </div>

      {/* Corpo: régua de horas + colunas com blocos posicionados em absoluto */}
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
          <div key={prof.id} className="relative border-l border-ink-800">
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
  );
}
