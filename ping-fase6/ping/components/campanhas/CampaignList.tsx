import type { Campaign } from "@/lib/types";
import { Card } from "@/components/ui/Card";

const STATUS_STYLE: Record<Campaign["status"], string> = {
  rascunho: "bg-ink-800 text-paper-500",
  agendada: "bg-brass-500/15 text-brass-400",
  enviada: "bg-signal-500/15 text-signal-500",
};

const STATUS_LABEL: Record<Campaign["status"], string> = {
  rascunho: "Rascunho",
  agendada: "Agendada",
  enviada: "Enviada",
};

export function CampaignList({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <Card key={c.id} className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm">{c.name}</p>
            <span className={`text-[11px] px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>
              {STATUS_LABEL[c.status]}
            </span>
          </div>
          <p className="text-sm text-paper-500">{c.message}</p>
        </Card>
      ))}
      {campaigns.length === 0 && (
        <p className="text-sm text-paper-500 text-center py-8">
          Nenhuma campanha criada ainda
        </p>
      )}
    </div>
  );
}
