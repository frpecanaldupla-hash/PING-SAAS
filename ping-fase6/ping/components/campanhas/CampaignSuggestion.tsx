"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import type { Client, FidelityConfig } from "@/lib/types";
import { suggestCampaign } from "@/lib/campaigns/segments";
import { whatsappLink } from "@/lib/campaigns/whatsapp";

export function CampaignSuggestion({
  clients,
  fidelityConfig,
}: {
  clients: Client[];
  fidelityConfig: FidelityConfig;
}) {
  const suggestion = suggestCampaign(clients, fidelityConfig);
  const [message, setMessage] = useState(suggestion.message);

  return (
    <div className="ping-card p-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={18} className="text-brass-400" />
        <p className="text-sm font-semibold">Sugestão para hoje</p>
        <span className="text-[11px] bg-ink-800 text-paper-400 px-2.5 py-1 rounded-full">
          {suggestion.audienceLabel} · {suggestion.matched.length}{" "}
          {suggestion.matched.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none resize-none mb-5"
      />

      {suggestion.matched.length === 0 ? (
        <p className="text-sm text-paper-500">
          Ninguém se encaixa nesse segmento agora — sem envios pendentes.
        </p>
      ) : (
        <div className="space-y-2">
          {suggestion.matched.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3 rounded-sm border border-ink-700"
            >
              <span className="text-sm font-medium">{c.name}</span>
              <a
                href={whatsappLink(c.phone, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal-500 hover:text-signal-400 transition-colors"
              >
                <Send size={13} /> Enviar via WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
