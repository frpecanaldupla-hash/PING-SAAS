// Os 3 planos do PING — fixos, sem tabela no banco por 3 valores só (mesmo
// espírito de AUDIENCE_LABEL em lib/campaigns/segments.ts). `subscriptions.plan`
// guarda só o id; preço e label vêm sempre daqui, nunca duplicados no banco.
export type PlanId = "mensal" | "trimestral" | "anual";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  /** Preço "por mês" pra comparação lado a lado entre os 3 planos. */
  monthlyPrice: number;
  /** Valor cobrado a cada ciclo de cobrança (monthlyPrice × billingCycleMonths). */
  billingPrice: number;
  billingCycleLabel: string;
  billingCycleMonths: number;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  mensal: {
    id: "mensal",
    label: "Mensal",
    monthlyPrice: 59.9,
    billingPrice: 59.9,
    billingCycleLabel: "cobrado todo mês",
    billingCycleMonths: 1,
  },
  trimestral: {
    id: "trimestral",
    label: "Trimestral",
    monthlyPrice: 49.9,
    billingPrice: 149.7,
    billingCycleLabel: "cobrado a cada 3 meses",
    billingCycleMonths: 3,
  },
  anual: {
    id: "anual",
    label: "Anual",
    monthlyPrice: 39.9,
    billingPrice: 478.8,
    billingCycleLabel: "cobrado uma vez por ano",
    billingCycleMonths: 12,
  },
};

export const PLAN_ORDER: PlanId[] = ["mensal", "trimestral", "anual"];
