// O poste de barbeiro reinterpretado como divisor de seção: uma linha fina
// com listras diagonais signal/latão correndo devagar. Puramente
// decorativo (aria-hidden); a animação para sozinha com
// prefers-reduced-motion via regra global de globals.css.
export function BarberPole({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      role="separator"
      className={`relative h-[3px] rounded-full overflow-hidden ${className}`}
    >
      <span
        className="absolute inset-0 opacity-85 animate-pole-run"
        style={{
          background:
            "repeating-linear-gradient(115deg, #E8432F 0 14px, #1C1A18 14px 28px, #C9A227 28px 42px, #1C1A18 42px 56px)",
          backgroundSize: "200% 100%",
        }}
      />
      <span
        className="absolute inset-0"
        style={{ boxShadow: "0 0 14px rgba(232,67,47,0.35)" }}
      />
    </div>
  );
}
