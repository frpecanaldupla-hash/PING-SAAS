import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { periodRange, type PeriodKey } from "@/lib/financeiro/period";

const VALID_PERIODS: PeriodKey[] = ["hoje", "semana", "mes", "ano"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const business = await getCurrentBusiness(supabase);
  if (!business) {
    return new Response("Não autenticado", { status: 401 });
  }

  const raw = request.nextUrl.searchParams.get("period");
  const period: PeriodKey = VALID_PERIODS.includes(raw as PeriodKey) ? (raw as PeriodKey) : "mes";
  const { current } = periodRange(period);

  const { data: rows } = await supabase
    .from("transactions")
    .select("created_at, type, method, amount")
    .eq("business_id", business.id)
    .gte("created_at", current.start.toISOString())
    .lte("created_at", current.end.toISOString())
    .order("created_at", { ascending: true });

  const labelType: Record<string, string> = { receita: "Receita", despesa: "Despesa", comissao: "Comissão" };
  const labelMethod: Record<string, string> = { pix: "PIX", cartao: "Cartão", dinheiro: "Dinheiro" };

  const header = "Data,Tipo,Forma de pagamento,Valor\n";
  const lines = (rows ?? []).map((t) => {
    const date = new Date(t.created_at).toLocaleDateString("pt-BR");
    const valor = Number(t.amount).toFixed(2).replace(".", ",");
    return `${date},${labelType[t.type] ?? t.type},${labelMethod[t.method] ?? t.method},${valor}`;
  });

  const csv = "\uFEFF" + header + lines.join("\n"); // BOM: abre com acento certo no Excel

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-${period}.csv"`,
    },
  });
}
