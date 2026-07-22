import { Card } from "@/components/ui/Card";

export type ReferralRow = {
  id: string;
  businessName: string;
  convertedAt: string | null;
  createdAt: string;
};

export function ReferralList({ referrals }: { referrals: ReferralRow[] }) {
  const totalReferred = referrals.length;
  const totalConverted = referrals.filter((r) => r.convertedAt).length;

  return (
    <>
      <Card tone="gold" className="p-6 text-center">
        <p className="ping-figure text-3xl font-semibold text-brass-400">
          {totalConverted} de {totalReferred}
        </p>
        <p className="text-xs text-paper-500 mt-1">
          {totalReferred === 0
            ? "indicações converteram — comece compartilhando seu link"
            : "indicações converteram"}
        </p>
      </Card>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">Indicados</p>
        {referrals.length === 0 ? (
          <p className="text-sm text-paper-500 text-center py-6">
            Ninguém indicado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-3 rounded-sm border border-ink-700"
              >
                <span className="text-sm font-medium">{r.businessName}</span>
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full ${
                    r.convertedAt
                      ? "bg-signal-500/15 text-signal-500"
                      : "bg-ink-800 text-paper-500"
                  }`}
                >
                  {r.convertedAt ? "Convertida" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
