"use client";

import { useState, useTransition } from "react";
import { CalendarOff, Check, ChevronDown, Pencil, Plus, UserPlus, X } from "lucide-react";
import type { Appointment, Professional, ProfessionalTimeOff, TimeOffKind } from "@/lib/types";
import {
  addProfessional,
  addProfessionalTimeOff,
  deleteProfessionalTimeOff,
  updateProfessional,
} from "@/app/rh/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const WEEKDAY_LABELS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function cutsToday(professionalId: string, appointments: Appointment[]) {
  return appointments.filter(
    (a) => a.professionalId === professionalId && a.status === "completed"
  ).length;
}

// Descreve um bloqueio pra exibição — nada disso é guardado no banco, é só
// como o front lê os campos crus (kind/weekday/date/startTime/endTime).
function describeTimeOff(row: ProfessionalTimeOff): string {
  const dayPart =
    row.kind === "recurring"
      ? `Toda ${WEEKDAY_LABELS[row.weekday ?? 0]}`
      : new Date(`${row.date}T00:00:00`).toLocaleDateString("pt-BR");
  const timePart = row.startTime && row.endTime ? `${row.startTime}–${row.endTime}` : "dia inteiro";
  return row.label ? `${row.label} · ${dayPart}, ${timePart}` : `${dayPart}, ${timePart}`;
}

type NewTimeOffInput = {
  kind: TimeOffKind;
  weekday: number | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  label: string | null;
};

export function TeamManager({
  professionals,
  appointments,
  timeOff,
}: {
  professionals: Professional[];
  appointments: Appointment[];
  timeOff: ProfessionalTimeOff[];
}) {
  const [list, setList] = useState(professionals);
  const [blocks, setBlocks] = useState(timeOff);
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

  // Não otimista de propósito (ao contrário de handleAdd acima): um
  // bloqueio malformado brevemente visível é mais estranho que um botão
  // "Salvando..." — e é uma ação rara o bastante pra isso não incomodar.
  // Quem chama (TeamCard) mantém o form aberto e mostra o erro se vier um.
  async function addBlock(
    professionalId: string,
    input: NewTimeOffInput
  ): Promise<{ error: string | null }> {
    const result = await addProfessionalTimeOff(professionalId, input);
    if (result.error || !result.id) {
      return { error: result.error ?? "Não foi possível salvar." };
    }
    setBlocks((prev) => [
      ...prev,
      {
        id: result.id!,
        businessId: professionals[0]?.businessId ?? "",
        professionalId,
        ...input,
        createdAt: new Date().toISOString(),
      },
    ]);
    return { error: null };
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    startTransition(async () => {
      await deleteProfessionalTimeOff(id);
    });
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {list.map((p) => (
        <TeamCard
          key={p.id}
          professional={p}
          cuts={cutsToday(p.id, appointments)}
          blocks={blocks.filter((b) => b.professionalId === p.id)}
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
          onAddBlock={(input) => addBlock(p.id, input)}
          onRemoveBlock={removeBlock}
        />
      ))}

      <Card className="p-6">
        {adding ? (
          <div className="w-full space-y-3">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do profissional"
            />
            <Input
              value={newCommission}
              onChange={(e) => setNewCommission(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="Comissão % (opcional)"
              inputMode="decimal"
            />
            {addError && <p className="text-danger text-xs">{addError}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setAdding(false); setAddError(null); }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={isPending} className="flex-1">
                Adicionar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <button
              onClick={() => setAdding(true)}
              className="flex flex-col items-center gap-2 text-paper-500 hover:text-paper-50 transition-colors py-6"
            >
              <UserPlus size={22} />
              <span className="text-sm">Adicionar profissional</span>
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

function TeamCard({
  professional: p,
  cuts,
  blocks,
  onChange,
  onAddBlock,
  onRemoveBlock,
}: {
  professional: Professional;
  cuts: number;
  blocks: ProfessionalTimeOff[];
  onChange: (patch: Partial<Professional>) => void;
  onAddBlock: (input: NewTimeOffInput) => Promise<{ error: string | null }>;
  onRemoveBlock: (id: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(p.name);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState(
    p.commissionPercent != null ? String(p.commissionPercent) : ""
  );

  const [showBlocks, setShowBlocks] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockKind, setBlockKind] = useState<TimeOffKind>("recurring");
  const [blockWeekday, setBlockWeekday] = useState(1);
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockLabel, setBlockLabel] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [isSavingBlock, startSavingBlock] = useTransition();

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

  function resetBlockForm() {
    setAddingBlock(false);
    setBlockError(null);
    setBlockDate("");
    setBlockStart("");
    setBlockEnd("");
    setBlockLabel("");
  }

  // Mesma validação da Server Action (ver app/rh/actions.ts) checada aqui
  // primeiro — evita a ida e volta ao servidor pro caso comum de erro de
  // digitação, mas o servidor valida de novo (nunca confia só no cliente).
  function submitBlock() {
    setBlockError(null);
    if (blockKind === "date" && !blockDate) {
      setBlockError("Escolha uma data.");
      return;
    }
    if ((blockStart && !blockEnd) || (!blockStart && blockEnd)) {
      setBlockError("Preencha os dois horários, ou deixe os dois em branco pro dia inteiro.");
      return;
    }
    if (blockStart && blockEnd && blockStart >= blockEnd) {
      setBlockError("O horário de início precisa ser antes do de fim.");
      return;
    }

    startSavingBlock(async () => {
      const result = await onAddBlock({
        kind: blockKind,
        weekday: blockKind === "recurring" ? blockWeekday : null,
        date: blockKind === "date" ? blockDate : null,
        startTime: blockStart || null,
        endTime: blockEnd || null,
        label: blockLabel.trim() || null,
      });
      if (result.error) {
        setBlockError(result.error);
        return;
      }
      resetBlockForm();
      setShowBlocks(true);
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-ink-800 to-ink-900 border border-steel-800 flex items-center justify-center font-semibold text-sm shrink-0">
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

      {/* Folgas/bloqueios de horário — somam da lista de horários oferecidos
          na Agenda (BookingDrawer) e no agendamento do cliente
          (ClientBookingFlow), ver isSlotBlocked em lib/agenda/time.ts.
          Escondido atrás de um toggle pra não pesar o cartão por padrão. */}
      <div className="mt-4 pt-4 border-t border-ink-800">
        <button
          onClick={() => setShowBlocks((v) => !v)}
          className="w-full flex items-center justify-between text-xs text-paper-500 hover:text-paper-50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <CalendarOff size={13} />
            Bloqueios{blocks.length > 0 ? ` (${blocks.length})` : ""}
          </span>
          <ChevronDown
            size={13}
            className={`transition-transform ${showBlocks ? "rotate-180" : ""}`}
          />
        </button>

        {showBlocks && (
          <div className="mt-3 space-y-2">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-2 text-[11px] text-paper-400 bg-ink-800/60 rounded-sm px-2.5 py-2"
              >
                <span className="truncate">{describeTimeOff(b)}</span>
                <button
                  onClick={() => onRemoveBlock(b.id)}
                  className="text-paper-500 hover:text-danger transition-colors shrink-0"
                  aria-label="Remover bloqueio"
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {addingBlock ? (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setBlockKind("recurring")}
                    className={`flex-1 py-1.5 rounded-sm text-[11px] border transition-colors ${
                      blockKind === "recurring"
                        ? "border-signal-400 text-paper-50"
                        : "border-ink-700 text-paper-500 hover:text-paper-100"
                    }`}
                  >
                    Toda semana
                  </button>
                  <button
                    onClick={() => setBlockKind("date")}
                    className={`flex-1 py-1.5 rounded-sm text-[11px] border transition-colors ${
                      blockKind === "date"
                        ? "border-signal-400 text-paper-50"
                        : "border-ink-700 text-paper-500 hover:text-paper-100"
                    }`}
                  >
                    Uma data
                  </button>
                </div>

                {blockKind === "recurring" ? (
                  <select
                    value={blockWeekday}
                    onChange={(e) => setBlockWeekday(Number(e.target.value))}
                    className="w-full bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-xs outline-none focus:border-signal-500 transition-colors capitalize"
                  >
                    {WEEKDAY_LABELS.map((label, i) => (
                      <option key={i} value={i}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-xs outline-none focus:border-signal-500 transition-colors"
                  />
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="flex-1 min-w-0 bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-xs outline-none focus:border-signal-500 transition-colors"
                  />
                  <span className="text-paper-500 text-[11px] shrink-0">até</span>
                  <input
                    type="time"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="flex-1 min-w-0 bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-xs outline-none focus:border-signal-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-paper-500">
                  Deixe os horários em branco pra bloquear o dia inteiro.
                </p>

                <input
                  value={blockLabel}
                  onChange={(e) => setBlockLabel(e.target.value)}
                  placeholder="Ex: Almoço (opcional)"
                  className="w-full bg-ink-800 border border-ink-700 rounded-sm px-2 py-1.5 text-xs outline-none focus:border-signal-500 transition-colors"
                />

                {blockError && <p className="text-danger text-[11px]">{blockError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={resetBlockForm}
                    className="flex-1 py-1.5 border border-ink-700 rounded-sm text-[11px] text-paper-400 hover:text-paper-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitBlock}
                    disabled={isSavingBlock}
                    className="flex-1 py-1.5 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm text-[11px] transition-colors"
                  >
                    {isSavingBlock ? "Salvando..." : "Adicionar"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingBlock(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-ink-700 rounded-sm text-[11px] text-paper-400 hover:text-paper-50 hover:border-signal-400/40 transition-colors"
              >
                <Plus size={12} /> Bloquear horário
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
