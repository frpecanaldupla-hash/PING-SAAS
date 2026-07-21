// Atmosfera de fundo do universo PING — três luzes volumétricas (a quente
// do signal, o lastro frio de aço, um toque de latão) sobre o degradê de
// ink, com uma camada de grain por cima pra tirar o "liso de dashboard".
// Fica em `fixed` atrás de tudo: quem usa precisa pôr o conteúdo em um
// wrapper `relative z-10`. Puramente decorativa (aria-hidden, sem eventos).
export function Atmosphere() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 78% 30%, rgba(232,67,47,0.10) 0%, transparent 60%)",
            "radial-gradient(ellipse 60% 45% at 18% 85%, rgba(46,51,58,0.35) 0%, transparent 65%)",
            "radial-gradient(ellipse 45% 35% at 70% 90%, rgba(201,162,39,0.05) 0%, transparent 60%)",
            "linear-gradient(180deg, #0A0908 0%, #131211 55%, #0A0908 100%)",
          ].join(", "),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
