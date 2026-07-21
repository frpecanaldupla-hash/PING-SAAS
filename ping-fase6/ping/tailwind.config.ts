import type { Config } from "tailwindcss";

// Design tokens PING — inspirado no universo de barbearia (navalha, néon de vitrine,
// couro das poltronas) traduzido para um SaaS premium em dark mode.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base — preto quente, não o preto-azulado genérico de dashboard
        ink: {
          950: "#0A0908",
          900: "#131211",
          850: "#171512",
          800: "#1C1A18",
          700: "#28251F",
          600: "#3A362E",
        },
        // Sinal — vermelho de neon de vitrine de barbearia, o "PING" acontecendo
        signal: {
          300: "#FF8560",
          400: "#FF5B3D",
          500: "#E8432F",
          600: "#C4331F",
        },
        // Latão — remete à navalha, ao espelho, usado para fidelidade/premium
        brass: {
          300: "#E8CE8A",
          400: "#D4AF5A",
          500: "#C9A227",
        },
        // Aço — cinza frio de lâmina/instrumento, para detalhes neutros que
        // não podem competir com signal nem brass
        steel: {
          400: "#8B95A1",
          800: "#2E333A",
        },
        paper: {
          50: "#F7F4EE",
          100: "#EDE8DC",
          400: "#A8A296",
          500: "#7C7669",
        },
        success: "#4ADE80",
        danger: "#F87171",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "20px",
      },
      boxShadow: {
        ping: "0 0 0 1px rgba(232,67,47,0.15), 0 8px 30px -10px rgba(232,67,47,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "ping-ring": {
          "0%": { transform: "scale(0.5)", opacity: "0.95" },
          "70%": { opacity: "0.18" },
          "100%": { transform: "scale(2.55)", opacity: "0" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Respiração do glow atrás do PingMark
        "breathe": {
          "0%, 100%": { opacity: "0.72", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.07)" },
        },
        // Rotação contínua — dial de precisão (lenta) e sheen metálico (média)
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        // Barras de "onda sonora" do badge da marca
        "wave-bounce": {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        // Listras do divisor barber-pole correndo
        "pole-run": {
          to: { backgroundPosition: "-112px 0" },
        },
        // Lens flare pulsando sobre o núcleo do PingMark
        "flare": {
          "0%, 100%": { opacity: "0.28" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        "ping-ring": "ping-ring 2.7s cubic-bezier(0.2,0.65,0.35,1) infinite",
        "rise": "rise 0.5s cubic-bezier(0.2,0.6,0.2,1) both",
        "breathe": "breathe 3.6s ease-in-out infinite",
        "spin-slow": "spin-slow 46s linear infinite",
        "spin-sheen": "spin-slow 5.5s linear infinite",
        "wave-bounce": "wave-bounce 1.1s ease-in-out infinite",
        "pole-run": "pole-run 9s linear infinite",
        "flare": "flare 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
