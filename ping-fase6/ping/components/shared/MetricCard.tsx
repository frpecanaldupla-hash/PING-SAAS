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
    <div className="ping-card p-6">
      <p className="text-paper-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="ping-figure text-3xl font-semibold mt-3">{value}</p>
      <p className={`text-xs mt-2 ${tone === "positive" ? "text-signal-500" : "text-paper-500"}`}>
        {change}
      </p>
    </div>
  );
}
