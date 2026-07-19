"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, UserPlus } from "lucide-react";
import type { Appointment, Professional } from "@/lib/types";
import { addProfessional, updateProfessional } from "@/app/rh/actions";

function cutsToday(professionalId: string, appointments: Appointment[]) {
  return appointments.filter(
    (a) => a.professionalId === professionalId && a.status === "completed"
  ).length;
}

export function TeamManager({
  professionals,
  appointments,
}: {
  professionals: Professional[];
  appointments: Appointment[];
}) {
  const [list, setList] = useState(professionals);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCommission, setNewCommission] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patchLocal(id: string, patch: Partial<Professional>) {
    setList((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function handleAdd() {
    if (!newName.trim()) {
      setAddError("Digite um nome.");
      return;
    }
    setAddError(null);
    const commission = newCommission ? Number(newCommission.replace(",", ".")) : null;
    const optimisticId = `optimistic-${Date.now()}`;

    setList((prev) => [
      ...prev,
      {
        id: optimisticId,
        businessId: professionals[0]?.businessId ?? "",
        userId: null,
        name: newName.trim(),
        avatarUrl: null,
        role: "professional",
        active: true,
        commissionPercent: commission,
      },
    ]);
    setNewName("");
    setNewCommission("");
    setAdding(false);

    startTransition(async () => {
      const result = await addProfessional(newName.trim(), commission);
      if (result.error || !result.id) {
        setAddError(result.error ?? "Erro ao adicionar.");
        setList((prev) => prev.filter((p) => p.id !== optimisticId));
        return;
      }
      // Troca o id otimista pelo id real, sem precisar recarregar a página.
      setList((prev) => prev.map((p) => (p.id === optimisticId ? { ...p, id: result.id! } : p)));
    });
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {list.map((p) => (
        <TeamCard
          key={p.id}
          professional={p}
          cuts={cutsToday(p.id, appointments)}
          onChange={(patch) => {
            patchLocal(p.id, patch);
            startTransition(async () => {
              await updateProfessional(p.id, {
                name: patch.name,
                commissionPercent: patch.commissionPercent,
                active: patch.active,
              });
            });
          }}
        />
      ))}

      <div className="ping-card p-6 flex items-center justify-center">
        {adding ? (
          <div className="w-full space-y-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do profissional"
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5 text-sm focus:border-signal-500 outline-none"
            />
            <input
              value={newCommission}
              onChange={(e) => setNewCommission(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="Comissão % (opcional)"
              inputMode="decimal"
              className="w-full bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5 text-sm focus:border-signal-500 outline-none"
            />
            {addError && <p className="text-danger text-xs">{addError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setAdding(false); setAddError(null); }}
                className="flex-1 py-2 border border-ink-700 rounded-sm text-xs text-paper-400 hover:text-paper-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={isPending}
                className="flex-1 py-2 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm text-xs transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex flex-col items-center gap-2 text-paper-500 hover:text-paper-50 transition-colors py-6"
          >
            <UserPlus size={22} />
            <span className="text-sm">Adicionar profissional</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TeamCard({
  professional: p,
  cuts,
  onChange,
}: {
  professional: Professional;
  cuts: number;
  onChange: (patch: Partial<Professional>) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(p.name);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState(
    p.commissionPercent != null ? String(p.commissionPercent) : ""
  );

  function saveName() {
    const clean = nameValue.trim();
    if (!clean || clean === p.name) {
      setNameValue(p.name);
      setEditingName(false);
      return;
    }
    onChange({ name: clean });
    setEditingName(false);
  }

  function saveCommission() {
    const value = commissionValue ? Number(commissionValue.replace(",", ".")) : null;
    onChange({ commissionPercent: value });
    setEditingCommission(false);
  }

  return (
    <div className="ping-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center font-semibold text-sm shrink-0">
          {p.name.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={() => onChange({ active: !p.active })}
          className={`text-[11px] px-2 py-1 rounded-full transition-colors ${
            p.active
              ? "bg-signal-500/15 text-signal-500 hover:bg-signal-500/25"
              : "bg-ink-800 text-paper-500 hover:bg-ink-700"
          }`}
          title={p.active ? "Clique para desativar" : "Clique para reativar"}
        >
          {p.active ? "Ativo" : "Inativo"}
        </button>
      </div>

      {editingName ? (
        <div className="flex items-center gap-1 mb-1">
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") { setNameValue(p.name); setEditingName(false); }
            }}
            className="w-full bg-ink-800 border border-signal-500 rounded-sm px-2 py-1 text-sm outline-none"
          />
          <button onClick={saveName} className="text-signal-500 shrink-0"><Check size={14} /></button>
          <button
            onClick={() => { setNameValue(p.name); setEditingName(false); }}
            className="text-paper-500 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="group flex items-center gap-1.5 mb-1"
        >
          <span className="font-semibold">{p.name}</span>
          <Pencil size={11} className="text-paper-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      <p className="text-xs text-paper-500 capitalize">
        {p.role === "owner" ? "Dono" : "Profissional"}
      </p>

      <div className="flex items-baseline justify-between mt-5 pt-4 border-t border-ink-800">
        <div>
          <p className="ping-figure text-xl font-semibold">{cuts}</p>
          <p className="text-[11px] text-paper-500">cortes hoje</p>
        </div>

        {editingCommission ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value.replace(/[^\d.,]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCommission();
                if (e.key === "Escape") setEditingCommission(false);
              }}
              className="w-14 bg-ink-800 border border-signal-500 rounded-sm px-1.5 py-1 text-sm text-right outline-none"
            />
            <span className="text-xs text-paper-500">%</span>
            <button onClick={saveCommission} className="text-signal-500 shrink-0"><Check size={13} /></button>
          </div>
        ) : (
          <button
            onClick={() => setEditingCommission(true)}
            className="group text-right"
          >
            <p className="ping-figure text-xl font-semibold text-brass-400 flex items-center gap-1 justify-end">
              {p.commissionPercent != null ? `${p.commissionPercent}%` : "—"}
              <Pencil size={10} className="text-paper-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-[11px] text-paper-500">comissão</p>
          </button>
        )}
      </div>
    </div>
  );
}
