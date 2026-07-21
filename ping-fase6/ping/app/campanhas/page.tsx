import { CampaignSuggestion } from "@/components/campanhas/CampaignSuggestion";
import { CampaignList } from "@/components/campanhas/CampaignList";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { PageHeader } from "@/components/ui/PageHeader";
import { MOCK_CLIENTS, MOCK_FIDELITY_CONFIG, MOCK_CAMPAIGNS } from "@/lib/mock/data";

export default function CampanhasPage() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-paper-50 pb-16 overflow-x-hidden">
      <Atmosphere />

      <div className="relative z-10">
        <PageHeader title="Campanhas" subtitle="Barbearia Central" />

        <main className="px-5 lg:px-10 py-8 max-w-3xl mx-auto space-y-8">
          <CampaignSuggestion clients={MOCK_CLIENTS} fidelityConfig={MOCK_FIDELITY_CONFIG} />

          <div>
            <p className="text-xs uppercase tracking-wide text-paper-500 mb-4">
              Histórico
            </p>
            <CampaignList campaigns={MOCK_CAMPAIGNS} />
          </div>
        </main>
      </div>
    </div>
  );
}
