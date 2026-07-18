"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Transaction } from "@/lib/types";

const METHOD_LABEL: Record<Transaction["method"], string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

export function RevenueByMethodChart({ transactions }: { transactions: Transaction[] }) {
  const byMethod = (["pix", "cartao", "dinheiro"] as const).map((method) => ({
    method: METHOD_LABEL[method],
    total: transactions
      .filter((t) => t.type === "receita" && t.method === method)
      .reduce((sum, t) => sum + t.amount, 0),
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={byMethod}>
          <CartesianGrid strokeDasharray="3 3" stroke="#28251F" vertical={false} />
          <XAxis dataKey="method" stroke="#7C7669" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(232,67,47,0.08)" }}
            contentStyle={{
              background: "#131211",
              border: "1px solid #28251F",
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
          />
          <Bar dataKey="total" fill="#E8432F" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
