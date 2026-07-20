"use client";

import { useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { completeAppointment } from "@/app/agenda/actions";

const METHODS: { value: "pix" | "cartao" | "dinheiro"; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
];

export function CompleteAppointmentModal({
  appointmentId,
  suggestedAmount,
  onClose,
  onDone,
}: {
  appointmentId: string;
  suggestedAmount: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [method, setMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    const value = Number(amount.replace(",", "."));
    setError(null);
    startTransition(async () => {
      const result = await completeAppointment(appointmentId, value, method);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div
  className="fixed inset-0 z-50 bg-ink-950/80 flex items-center justify-center px-4"
  onClick={(e) => e.stopPropagation()}
>
  <div className="ping-card w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Concluir agendamento</p>
          <button onClick={onClose} className="text-paper-500"><X size={18} /></button>
        </div>

        <label className="text-xs text-paper-500 mb-1 block">Valor cobrado (R$)</label>
        <input
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
          inputMode="decimal"
          className="w-full bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5 text-sm focus:border-signal-500 outline-none mb-4"
        />

        <label className="text-xs text-paper-500 mb-1.5 block">Forma de pagamento</label>
        <div className="flex gap-2 mb-5">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`flex-1 py-2 rounded-sm text-xs font-medium border transition-colors ${
                method === m.value
                  ? "bg-signal-500 text-ink-950 border-signal-500"
                  : "border-ink-700 text-paper-400"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {error && <p className="text-danger text-xs mb-3">{error}</p>}

        <button
          onClick={confirm}
          disabled={isPending}
          className="w-full py-3 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm text-sm flex items-center justify-center gap-2"
        >
          <Check size={16} /> {isPending ? "Salvando..." : "Confirmar conclusão"}
        </button>
      </div>
    </div>
  );
}
