// Assinatura visual do produto: um ponto central (o "ping" chegando) com anéis de
// onda se expandindo — a mesma metáfora do nome, da notificação instantânea e do
// QR Code de check-in. Reaparece em escala menor em toda a interface (loading,
// badges de novo agendamento, confirmação de check-in) para dar consistência.
export function PingMark({ size = 120 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inline-flex h-2/3 w-2/3 rounded-full bg-signal-500/40 animate-ping-ring" />
      <span
        className="absolute inline-flex h-2/3 w-2/3 rounded-full bg-signal-500/30 animate-ping-ring"
        style={{ animationDelay: "0.6s" }}
      />
      <span className="relative inline-flex h-1/3 w-1/3 rounded-full bg-signal-500 shadow-ping" />
    </div>
  );
}
