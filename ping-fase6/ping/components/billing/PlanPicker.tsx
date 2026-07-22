"use client";

import { Check } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/billing/plans";

// Reaproveitado no cadastro (escolhe o plano, sem cobrar ainda — Fase 2) e
// no checkout depois do trial (Fase 3, cobra de verdade).
export function PlanPicker({ value, onChange }: { value: PlanId; onChange: (id: PlanId) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`text-left p-4 rounded-lg border transition-all ${
              selected
                ? "border-signal-400 bg-signal-500/10 shadow-[0_0_16px_rgba(232,67,47,0.2)]"
                : "border-ink-700 hover:border-paper-500"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-semibold text-sm">{plan.label}</p>
              {selected && <Check size={14} className="text-signal-400 shrink-0" />}
            </div>
            <p className="ping-figure text-2xl font-semibold text-brass-400">
              R$ {plan.monthlyPrice.toFixed(2).replace(".", ",")}
              <span className="text-xs text-paper-500 font-normal">/mês</span>
            </p>
            <p className="text-[11px] text-paper-500 mt-1">{plan.billingCycleLabel}</p>
          </button>
        );
      })}
    </div>
  );
}
