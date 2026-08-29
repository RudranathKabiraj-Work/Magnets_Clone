import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./layout/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FE6F34",
          coral: "#FE504F",
          yellow: "#FDC957",
          aqua: "#7FD4DD",
          soft: "#F7F5F1",
        },
        ink: {
          50: "#F7F5F1",
          100: "#EFEBE4",
          200: "#DFD8CF",
          300: "#C9BFB2",
          400: "#9D9488",
          500: "#746D64",
          600: "#5C554E",
          700: "#46403B",
          800: "#2D2A27",
          900: "#1F1D1B",
          950: "#111111",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 24px 50px -40px rgba(17,17,17,0.35)",
        hero: "0 32px 90px -46px rgba(17,17,17,0.5)",
        form: "0 24px 70px -56px rgba(17,17,17,0.75)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;