// Assinatura visual do produto: um ponto central (o "ping" chegando) com
// anéis de onda se expandindo — a mesma metáfora do nome, da notificação
// instantânea e do QR Code de check-in.
//
// v3 "cyber-barber": o núcleo virou uma esfera metálica (gradiente radial +
// varredura cônica girando + aro fino de latão) e ganhou um glow que
// respira. A variante "hero" (landing, telas de boas-vindas) adiciona o
// dial de instrumento de precisão e um lens flare; a padrão ("core")
// continua compacta pra caber em headers, loading e confirmações.
//
// API retrocompatível: todos os usos antigos (`<PingMark size={72} />`)
// continuam funcionando e só ganham o visual novo.
export function PingMark({
  size = 120,
  variant = "core",
}: {
  size?: number;
  variant?: "core" | "hero";
}) {
  const hero = variant === "hero";
  // Proporções: no hero o núcleo é menor e o palco maior (mais ar pros
  // anéis e pro dial); na compacta o núcleo domina pra ler bem pequeno.
  const ringPct = hero ? "29%" : "40%";
  const corePct = hero ? "14%" : "33%";

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* glow respirando */}
      <span
        className="absolute rounded-full animate-breathe"
        style={{
          width: "92%",
          height: "92%",
          background:
            "radial-gradient(circle, rgba(255,91,61,0.36) 0%, rgba(232,67,47,0.14) 36%, rgba(201,162,39,0.05) 55%, transparent 70%)",
          filter: "blur(3px)",
        }}
      />

      {/* dial de precisão — só no hero */}
      {hero && (
        <span
          className="absolute rounded-full border border-dashed border-steel-400/20 animate-spin-slow"
          style={{ width: "65%", height: "65%" }}
        >
          <span
            className="absolute rounded-full bg-brass-500"
            style={{
              top: -3,
              left: "calc(50% - 3px)",
              width: 6,
              height: 6,
              boxShadow: "0 0 8px 2px rgba(201,162,39,0.55)",
            }}
          />
        </span>
      )}

      {/* anéis de onda */}
      {[0, 0.9, 1.8].map((delay) => (
        <span
          key={delay}
          className="absolute rounded-full border-[1.5px] border-signal-400 opacity-0 animate-ping-ring"
          style={{
            width: ringPct,
            height: ringPct,
            animationDelay: `${delay}s`,
            boxShadow:
              "0 0 20px 2px rgba(255,91,61,0.55), inset 0 0 14px rgba(255,91,61,0.25)",
          }}
        />
      ))}

      {/* núcleo metálico */}
      <span
        className="relative rounded-full"
        style={{
          width: corePct,
          height: corePct,
          background:
            "radial-gradient(circle at 34% 28%, #FF8560, #E8432F 62%, #B62E1F 100%)",
          boxShadow:
            "0 0 18px 5px rgba(255,91,61,0.85), 0 0 54px 18px rgba(232,67,47,0.45), inset 0 -4px 8px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.4)",
        }}
      >
        {/* aro fino de latão — a assinatura quente no meio do neon */}
        <span
          className="absolute rounded-full border border-brass-300/55"
          style={{ inset: "-11%", boxShadow: "0 0 10px rgba(201,162,39,0.35)" }}
        />
        {/* varredura metálica girando */}
        <span className="absolute inset-0 rounded-full overflow-hidden">
          <span
            className="absolute inset-0 animate-spin-sheen mix-blend-screen"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.5) 40deg, transparent 90deg, transparent 200deg, rgba(232,206,138,0.35) 245deg, transparent 300deg)",
            }}
          />
        </span>
      </span>

      {/* lens flare — só no hero */}
      {hero && (
        <span
          className="absolute animate-flare"
          style={{
            width: "40%",
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)",
            filter: "blur(0.5px)",
            transform: "rotate(-24deg)",
          }}
        />
      )}
    </div>
  );
}
