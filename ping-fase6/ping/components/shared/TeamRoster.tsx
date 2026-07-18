import type { Appointment, Professional } from "@/lib/types";

function cutsToday(professionalId: string, appointments: Appointment[]) {
  return appointments.filter(
    (a) => a.professionalId === professionalId && a.status === "completed"
  ).length;
}

export function TeamRoster({
  professionals,
  appointments,
}: {
  professionals: Professional[];
  appointments: Appointment[];
}) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {professionals.map((p) => (
        <div key={p.id} className="ping-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center font-semibold text-sm">
              {p.name.charAt(0)}
            </div>
            <span
              className={`text-[11px] px-2 py-1 rounded-full ${
                p.active
                  ? "bg-signal-500/15 text-signal-500"
                  : "bg-ink-800 text-paper-500"
              }`}
            >
              {p.active ? "Na barbearia" : "Fora"}
            </span>
          </div>
          <p className="font-semibold">{p.name}</p>
          <p className="text-xs text-paper-500 capitalize">
            {p.role === "owner" ? "Dono" : "Profissional"}
          </p>
          <div className="flex items-baseline justify-between mt-5 pt-4 border-t border-ink-800">
            <div>
              <p className="ping-figure text-xl font-semibold">
                {cutsToday(p.id, appointments)}
              </p>
              <p className="text-[11px] text-paper-500">cortes hoje</p>
            </div>
            {p.commissionPercent != null && (
              <div className="text-right">
                <p className="ping-figure text-xl font-semibold text-brass-400">
                  {p.commissionPercent}%
                </p>
                <p className="text-[11px] text-paper-500">comissão</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
