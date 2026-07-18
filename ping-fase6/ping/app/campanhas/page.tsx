import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignSuggestion } from "@/components/campanhas/CampaignSuggestion";
import { CampaignList } from "@/components/campanhas/CampaignList";
import { MOCK_CLIENTS, MOCK_FIDELITY_CONFIG, MOCK_CAMPAIGNS } from "@/lib/mock/data";

export default function CampanhasPage() {
  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <header className="flex items-center gap-4 px-5 lg:px-10 py-5 border-b border-ink-800">
        <Link href="/dashboard" className="text-paper-500 hover:text-paper-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wide leading-none">Campanhas</h1>
          <p className="text-xs text-paper-500 mt-1">Barbearia Central</p>
        </div>
      </header>

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
  );
}
