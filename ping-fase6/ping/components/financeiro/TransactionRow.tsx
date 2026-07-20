"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { cancelTransaction } from "@/app/financeiro/actions";

export function TransactionRow({
  id,
  label,
  detail,
  amountLabel,
  isRevenue,
}: {
  id: string;
  label: string;
  detail: string;
  amountLabel: string;
  isRevenue: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  function handleCancel() {
    if (!window.confirm("Cancelar esse lançamento? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      const result = await cancelTransaction(id);
      if (!result.error) setRemoved(true);
    });
  }

  if (removed) return null;

  return (
    <li className="flex items-center justify-between border-b border-ink-800 pb-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-paper-500">{detail}</p>
      </div>
      <div className="flex items-center gap-3">
        <p className={`text-sm font-semibold ${isRevenue ? "text-signal-500" : "text-danger"}`}>
          {isRevenue ? "+" : "-"} {amountLabel}
        </p>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-paper-500 hover:text-danger transition-colors disabled:opacity-40 shrink-0"
          title="Cancelar lançamento"
        >
          <X size={14} />
        </button>
      </div>
    </li>
  );
}
