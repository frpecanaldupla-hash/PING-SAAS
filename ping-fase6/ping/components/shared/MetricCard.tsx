import { Card } from "@/components/ui/Card";

export function MetricCard({
  label,
  value,
  change,
  tone = "positive",
}: {
  label: string;
  value: string;
  change: string;
  tone?: "positive" | "neutral";
}) {
  return (
    <Card className="p-6">
      <p className="text-paper-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="ping-figure text-3xl font-semibold mt-3">{value}</p>
      <p className={`text-xs mt-2 ${tone === "positive" ? "text-signal-400" : "text-paper-500"}`}>
        {change}
      </p>
    </Card>
  );
}
