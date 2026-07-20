"use client";

import { useState, useTransition } from "react";
import { Pencil, Target } from "lucide-react";
import { updateMonthlyGoal } from "@/app/financeiro/actions";

export function GoalEditor({
  currentGoal,
  currentRevenue,
}: {
  currentGoal: number;
  currentRevenue: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentGoal || ""));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const percent = currentGoal > 0 ? Math.min(Math.round((currentRevenue / currentGoal) * 100), 100) : 0;

  function save() {
    const target = Number(value.replace(",", "."));
    setError(null);
    startTransition(async () => {
      const result = await updateMonthlyGoal(target);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <div className="ping-card p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-paper-500 flex items-center gap-1.5">
          <Target size={13} /> Meta do mês
        </p>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setValue(String(currentGoal || "")); }}
            className="text-xs text-paper-500 hover:text-paper-50 flex items-center gap-1"
          >
            <Pencil size={12} /> {currentGoal > 0 ? "Editar" : "Definir meta"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
            inputMode="decimal"
            placeholder="Ex: 8000"
            className="flex-1 bg-ink-800 border border-ink-700 rounded-sm px-3 py-2 text-sm focus:border-signal-500 outline-none"
          />
          <button
            onClick={save}
            disabled={isPending}
            className="px-4 py-2 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm text-sm"
          >
            {isPending ? "..." : "Salvar"}
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 text-paper-500 text-sm">
            Cancelar
          </button>
        </div>
      ) : currentGoal > 0 ? (
        <>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="ping-figure text-lg font-semibold">{currency(currentRevenue)}</p>
            <p className="text-xs text-paper-500">de {currency(currentGoal)} · {percent}%</p>
          </div>
          <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
            <div className="h-full bg-brass-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </>
      ) : (
        <p className="text-sm text-paper-500">Defina uma meta pra acompanhar o progresso do mês.</p>
      )}

      {error && <p className="text-danger text-xs mt-2">{error}</p>}
    </div>
  );
}
