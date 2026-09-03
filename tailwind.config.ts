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
          orange: "#0066B2",
          coral: "#1C83D3",
          yellow: "#64C3FF",
          aqua: "#38BDF8",
          soft: "#F8FBFF",
        },
        ink: {
          50: "#F8FBFF",
          100: "#F0F4F8",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#090D16",
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