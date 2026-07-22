"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateBusinessHours } from "@/app/configuracoes/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// weekday segue Date.getDay(): 0=domingo..6=sábado (ver lib/types e
// migration 0011_business_hours.sql). A ordem de EXIBIÇÃO começa na
// segunda, mais natural pra pensar em "horário comercial" — a ordem de
// ARMAZENAMENTO/estado continua indexada por weekday.
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type HoursRow = { weekday: number; opensAt: string; closesAt: string; closed: boolean };

export function BusinessHoursForm({ initialRows }: { initialRows: HoursRow[] }) {
  const [rows, setRows] = useState<HoursRow[]>(initialRows);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateRow(weekday: number, patch: Partial<HoursRow>) {
    setSaved(false);
    setRows((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateBusinessHours(rows);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wide text-paper-500">Horário de funcionamento</p>

      <div className="space-y-2.5">
        {DISPLAY_ORDER.map((weekday) => {
          const row = rows.find((r) => r.weekday === weekday);
          if (!row) return null;
          return (
            <div key={weekday} className="flex items-center gap-3 flex-wrap">
              <span className="w-16 shrink-0 text-sm text-paper-400">{WEEKDAY_LABELS[weekday]}</span>

              <label className="flex items-center gap-1.5 text-xs text-paper-500 shrink-0">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(e) => updateRow(weekday, { closed: e.target.checked })}
                  className="accent-signal-500 w-4 h-4"
                />
                Fechado
              </label>

              <input
                type="time"
                value={row.opensAt}
                disabled={row.closed}
                onChange={(e) => updateRow(weekday, { opensAt: e.target.value })}
                className="bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-signal-500 disabled:opacity-40 transition-colors"
              />
              <span className="text-paper-500 text-xs">até</span>
              <input
                type="time"
                value={row.closesAt}
                disabled={row.closed}
                onChange={(e) => updateRow(weekday, { closesAt: e.target.value })}
                className="bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-signal-500 disabled:opacity-40 transition-colors"
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-danger text-xs border border-danger/40 bg-danger/10 rounded-xs px-3 py-2.5">
          {error}
        </p>
      )}

      <Button onClick={save} disabled={isPending} className="w-full">
        {isPending ? (
          "Salvando..."
        ) : saved ? (
          <>
            <Check size={16} /> Salvo
          </>
        ) : (
          "Salvar horários"
        )}
      </Button>
    </Card>
  );
}
