"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ClientQr } from "@/components/cliente/ClientQr";
import { Card } from "@/components/ui/Card";

// Reaproveita o mesmo componente de QR do check-in (ClientQr) — lá o valor
// codificado é um token opaco resolvido no servidor; aqui é uma URL
// completa, que qualquer câmera de celular abre direto no navegador, sem
// depender do app. O componente não faz ideia da diferença: só desenha o
// que recebe.
export function ShareLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (raro, ex: contexto não seguro) — sem
      // problema, o link já está visível e selecionável na tela.
    }
  }

  return (
    <Card className="p-6 text-center space-y-4">
      <p className="text-xs uppercase tracking-wide text-paper-500">Sua página pública</p>
      <p className="text-sm text-paper-400">
        Compartilhe esse link (ou cole o QR Code na parede/espelho) pra clientes acharem sua
        barbearia e criarem a conta deles sozinhos.
      </p>

      <div className="flex justify-center">
        <ClientQr token={url} size={160} />
      </div>

      <div className="flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-sm px-3 py-2.5">
        <span className="flex-1 text-xs text-paper-100 truncate text-left">{url}</span>
        <button
          onClick={copyLink}
          className="shrink-0 text-paper-400 hover:text-paper-50 transition-colors"
          aria-label="Copiar link"
        >
          {copied ? <Check size={15} className="text-signal-400" /> : <Copy size={15} />}
        </button>
      </div>
    </Card>
  );
}
