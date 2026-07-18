"use client";

import { QRCodeSVG } from "qrcode.react";

// O valor codificado é o `qrToken` do cliente — o mesmo que a tela de
// Check-in (busca manual hoje, câmera na fase seguinte) resolve contra
// `clients.qr_token` no Supabase para creditar pontos e visita.
export function ClientQr({ token, size = 200 }: { token: string; size?: number }) {
  return (
    <div className="bg-paper-50 rounded-sm p-4 inline-block">
      <QRCodeSVG value={token} size={size} fgColor="#0A0908" bgColor="#F7F4EE" />
    </div>
  );
}
