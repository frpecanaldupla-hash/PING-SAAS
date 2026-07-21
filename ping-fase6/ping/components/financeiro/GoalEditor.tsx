"use client";

import { useState, useTransition } from "react";
import { Pencil, Target } from "lucide-react";
import { updateMonthlyGoal } from "@/app/financeiro/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
    <Card tone="gold" className="p-6">
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
          <div className="flex-1">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
              inputMode="decimal"
              placeholder="Ex: 8000"
              className="py-2"
            />
          </div>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "..." : "Salvar"}
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      ) : currentGoal > 0 ? (
        <>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="ping-figure text-lg font-semibold">{currency(currentRevenue)}</p>
            <p className="text-xs text-paper-500">de {currency(currentGoal)} · {percent}%</p>
          </div>
          <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brass-500 to-brass-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-paper-500">Defina uma meta pra acompanhar o progresso do mês.</p>
      )}

      {error && <p className="text-danger text-xs mt-2">{error}</p>}
    </Card>
  );
}
