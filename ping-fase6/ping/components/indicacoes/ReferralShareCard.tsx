"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Link de indicação usa /cadastro?ref=<código> — outro DONO se cadastrando
// no PING, não um cliente (isso é o link de /b/[slug], em Configurações).
// O compartilhamento aqui é "manda pra qualquer contato do seu WhatsApp",
// por isso https://wa.me/?text= sem número, diferente do whatsappLink de
// lib/campaigns/whatsapp.ts (que sempre manda pra um telefone específico).
function whatsappShareLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function ReferralShareCard({ link, businessName }: { link: string; businessName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível — o link já está visível e selecionável na tela.
    }
  }

  const message = `${businessName} usa o PING pra agenda, fidelidade e cobrança e tá recomendando. Crie sua conta grátis por aqui: ${link}`;

  return (
    <Card className="p-6 text-center space-y-4">
      <p className="text-xs uppercase tracking-wide text-paper-500">Seu link de indicação</p>
      <p className="text-sm text-paper-400">
        Compartilhe com outros donos de barbearia ou salão — quando o negócio indicado pagar a
        primeira mensalidade, você ganha 1 mês grátis.
      </p>

      <div className="flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5">
        <span className="flex-1 text-xs text-paper-100 truncate text-left">{link}</span>
        <button
          onClick={copyLink}
          className="shrink-0 text-paper-400 hover:text-paper-50 transition-colors"
          aria-label="Copiar link"
        >
          {copied ? <Check size={15} className="text-signal-400" /> : <Copy size={15} />}
        </button>
      </div>

      <a
        href={whatsappShareLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-signal-400 hover:text-signal-300 transition-colors"
      >
        <Send size={15} /> Compartilhar no WhatsApp
      </a>
    </Card>
  );
}
