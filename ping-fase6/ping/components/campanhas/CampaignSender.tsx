"use client";

import { useMemo, useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import type { Client, FidelityConfig } from "@/lib/types";
import {
  SEGMENT_AUDIENCE,
  SEGMENT_LABEL,
  SEGMENT_ORDER,
  clientsForSegment,
  defaultMessageFor,
  defaultSegment,
  type SegmentKind,
} from "@/lib/campaigns/segments";
import { personalizeMessage, whatsappLink } from "@/lib/campaigns/whatsapp";
import { logCampaignSend } from "@/app/campanhas/actions";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

// Escolha manual de público (antes era uma sugestão automática única) — o
// dono troca de segmento, ajusta a mensagem se quiser, e clica um link de
// WhatsApp por cliente. Sem envio em massa: cada clique abre a conversa,
// igual o resto do produto já faz (ver "chamar de volta" em Fidelidade).
export function CampaignSender({
  clients,
  fidelityConfig,
  businessName,
}: {
  clients: Client[];
  fidelityConfig: FidelityConfig;
  businessName: string;
}) {
  // Bloqueado não recebe campanha — a mesma trava que já impede ele de
  // agendar sozinho pela Área do Cliente (ver migration 0014_client_blocked.sql).
  const activeClients = useMemo(() => clients.filter((c) => !c.blockedAt), [clients]);

  const [segment, setSegment] = useState<SegmentKind>(() => defaultSegment(activeClients, fidelityConfig));
  const [inactiveDays, setInactiveDays] = useState(30);
  const [message, setMessage] = useState(() => defaultMessageFor(segment, fidelityConfig));
  const [logged, setLogged] = useState(false);
  const [, startLogging] = useTransition();

  const matched = clientsForSegment(segment, activeClients, fidelityConfig, { inactiveDays });

  function selectSegment(next: SegmentKind) {
    setSegment(next);
    setMessage(defaultMessageFor(next, fidelityConfig));
    setLogged(false);
  }

  function handleFirstSend() {
    if (logged) return;
    setLogged(true);
    startLogging(async () => {
      await logCampaignSend({
        name: SEGMENT_LABEL[segment],
        audience: SEGMENT_AUDIENCE[segment],
        message,
      });
    });
  }

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={18} className="text-brass-400" />
        <p className="text-sm font-semibold">Escolha o público</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {SEGMENT_ORDER.map((kind) => (
          <button
            key={kind}
            onClick={() => selectSegment(kind)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              segment === kind
                ? "bg-gradient-to-br from-signal-400 to-signal-500 border-transparent text-ink-950 font-semibold shadow-[0_0_16px_rgba(232,67,47,0.35)]"
                : "border-ink-700 text-paper-400 font-medium hover:text-paper-50 hover:border-paper-500"
            }`}
          >
            {SEGMENT_LABEL[kind]}
          </button>
        ))}
      </div>

      {segment === "sumidos" && (
        <div className="mb-5 max-w-[200px]">
          <Input
            label="Sumido há quantos dias?"
            inputMode="numeric"
            value={String(inactiveDays)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setInactiveDays(digits ? Math.max(1, Number(digits)) : 0);
              setLogged(false);
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] bg-ink-800 text-paper-400 px-2.5 py-1 rounded-full">
          {matched.length} {matched.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      <div className="mb-5">
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setLogged(false);
          }}
          rows={3}
          hint="Use {nome} e {negocio} — cada link sai com o nome do cliente já preenchido."
        />
      </div>

      {matched.length === 0 ? (
        <p className="text-sm text-paper-500">
          Ninguém se encaixa nesse segmento agora — sem envios pendentes.
        </p>
      ) : (
        <div className="space-y-2">
          {matched.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3 rounded-sm border border-ink-700"
            >
              <span className="text-sm font-medium">{c.name}</span>
              <a
                href={whatsappLink(
                  c.phone,
                  personalizeMessage(message, { clientName: c.name, businessName })
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleFirstSend}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal-400 hover:text-signal-300 transition-colors"
              >
                <Send size={13} /> Enviar via WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
