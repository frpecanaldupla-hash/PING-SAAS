"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { renameProfessional } from "@/app/agenda/actions";

// Só aparece com o lápis no chip do PRÓPRIO profissional logado (ver
// app/agenda/page.tsx, que decide isso comparando professional.userId com
// o usuário autenticado). Os outros profissionais da equipe, por enquanto,
// mostram só o nome — editar o nome de outra pessoa é trabalho da tela de
// Equipe, que ainda está no mock.
export function ProfessionalName({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cancel() {
    setValue(name);
    setError(null);
    setEditing(false);
  }

  function save() {
    if (!value.trim() || value.trim() === name) {
      cancel();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await renameProfessional(id, value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold truncate"
        title="Editar seu nome"
      >
        <span className="truncate">{name}</span>
        <Pencil size={12} className="text-paper-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="w-24 bg-ink-800 border border-signal-500 rounded-sm px-2 py-1 text-xs text-center outline-none"
        />
        <button onClick={save} disabled={isPending} className="text-signal-500 shrink-0">
          <Check size={14} />
        </button>
        <button onClick={cancel} className="text-paper-500 shrink-0">
          <X size={14} />
        </button>
      </div>
      {error && <p className="text-danger text-[10px]">{error}</p>}
    </div>
  );
}
