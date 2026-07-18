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
          800: "#1C1A18",
          700: "#28251F",
          600: "#3A362E",
        },
        // Sinal — vermelho de neon de vitrine de barbearia, o "PING" acontecendo
        signal: {
          400: "#FF6B52",
          500: "#E8432F",
          600: "#C4331F",
        },
        // Latão — remete à navalha, ao espelho, usado para fidelidade/premium
        brass: {
          300: "#E8CE8A",
          400: "#D4AF5A",
          500: "#C9A227",
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
          "0%": { transform: "scale(0.9)", opacity: "0.9" },
          "70%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "ping-ring": "ping-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "rise": "rise 0.5s cubic-bezier(0.2,0.6,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
