"use client";

import { useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { completeAppointment } from "@/app/agenda/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="w-full max-w-sm p-6 animate-rise">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Concluir agendamento</p>
          <button onClick={onClose} className="text-paper-500 hover:text-paper-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <Input
            label="Valor cobrado (R$)"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            inputMode="decimal"
          />
        </div>

        <label className="text-xs text-paper-500 mb-1.5 block">Forma de pagamento</label>
        <div className="flex gap-2 mb-5">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`flex-1 py-2 rounded-sm text-xs border transition-all ${
                method === m.value
                  ? "bg-gradient-to-br from-signal-400 to-signal-500 border-transparent text-ink-950 font-semibold shadow-[0_0_16px_rgba(232,67,47,0.35)]"
                  : "border-ink-700 text-paper-400 font-medium hover:text-paper-50 hover:border-paper-500"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {error && <p className="text-danger text-xs mb-3">{error}</p>}

        <Button onClick={confirm} disabled={isPending} className="w-full">
          <Check size={16} /> {isPending ? "Salvando..." : "Confirmar conclusão"}
        </Button>
      </Card>
    </div>
  );
}
