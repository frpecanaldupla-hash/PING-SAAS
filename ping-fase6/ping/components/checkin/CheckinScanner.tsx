"use client";

import { useState } from "react";
import { ScanLine, CheckCircle2, Search } from "lucide-react";
import type { Client, FidelityConfig } from "@/lib/types";
import { PingMark } from "@/components/shared/PingMark";

// TODO(fase seguinte): trocar a busca manual por leitura real de câmera
// (ex: lib `html5-qrcode`) lendo o `qrToken` do cliente e resolvendo via
// Supabase (`select * from clients where qr_token = $1`). A ação de
// check-in em si — somar pontos e visita — já está isolada em `onCheckin`
// para plugar direto numa Server Action quando o schema estiver conectado.
export function CheckinScanner({
  clients,
  fidelityConfig,
}: {
  clients: Client[];
  fidelityConfig: FidelityConfig;
}) {
  const [query, setQuery] = useState("");
  const [confirmed, setConfirmed] = useState<Client | null>(null);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function onCheckin(client: Client) {
    setConfirmed(client);
  }

  if (confirmed) {
    return (
      <div className="ping-card p-10 text-center animate-rise">
        <CheckCircle2 size={64} className="text-signal-500 mx-auto mb-5" />
        <p className="font-display text-3xl tracking-wide mb-2">
          Check-in feito!
        </p>
        <p className="text-paper-400 mb-1">{confirmed.name} chegou.</p>
        <p className="ping-figure text-brass-400 text-lg font-semibold mb-8">
          +{fidelityConfig.pointsPerVisit} pontos
        </p>
        <button
          onClick={() => {
            setConfirmed(null);
            setQuery("");
          }}
          className="w-full py-3 border border-ink-700 hover:border-paper-500 rounded-sm transition-colors text-sm"
        >
          Próximo cliente
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="ping-card p-10 text-center flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <PingMark size={140} />
          <ScanLine
            size={28}
            className="absolute inset-0 m-auto text-ink-950"
            strokeWidth={2.5}
          />
        </div>
        <p className="font-semibold text-lg">Aponte o QR Code do cliente</p>
        <p className="text-sm text-paper-500 mt-1.5">
          O check-in acontece assim que a câmera reconhece o código
        </p>
      </div>

      <div className="ping-card p-6">
        <p className="text-xs uppercase tracking-wide text-paper-500 mb-3">
          Ou busque pelo nome
        </p>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do cliente"
            className="w-full bg-ink-800 border border-ink-700 rounded-sm pl-9 pr-3 py-2.5 text-sm focus:border-signal-500 outline-none"
          />
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onCheckin(c)}
              className="w-full text-left px-4 py-3 rounded-sm border border-ink-700 hover:border-signal-500/50 transition-colors flex justify-between items-center"
            >
              <span className="text-sm font-medium">{c.name}</span>
              <span className="ping-figure text-xs text-brass-400">{c.points} pts</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-paper-500 text-center py-6">
              Nenhum cliente encontrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
