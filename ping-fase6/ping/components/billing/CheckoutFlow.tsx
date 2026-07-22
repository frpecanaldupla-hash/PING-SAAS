"use client";

import { useState, useTransition } from "react";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { startCheckout } from "@/app/checkout/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlanId } from "@/lib/billing/plans";

export function CheckoutFlow({ initialPlan }: { initialPlan: PlanId }) {
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();

  function handleSubscribe() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(plan);
      if (result.error || !result.initPoint) {
        setError(result.error ?? "Não foi possível iniciar o checkout.");
        return;
      }
      // Navegação de página inteira de propósito (não router.push): sai do
      // PING pro checkout hospedado do Mercado Pago.
      window.location.href = result.initPoint;
    });
  }

  return (
    <Card className="p-6 space-y-5">
      <p className="text-sm text-paper-400">
        Escolha seu plano — você vai ser redirecionado pro checkout seguro do Mercado Pago pra
        finalizar. Nenhum dado do seu cartão passa pelo PING.
      </p>

      <PlanPicker value={plan} onChange={setPlan} />

      {error && <p className="text-danger text-xs">{error}</p>}

      <Button size="lg" onClick={handleSubscribe} disabled={isStarting} className="w-full">
        {isStarting ? "Abrindo checkout..." : "Assinar agora"}
      </Button>
    </Card>
  );
}
