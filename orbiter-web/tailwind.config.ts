import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        "bg-void": "var(--bg-void)",
        "bg-panel": "var(--bg-panel)",
        "bg-active": "var(--bg-active)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        "text-bright": "var(--text-bright)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-dim": "var(--text-dim)",
        "status-active": "var(--status-active)",
        "status-alert": "var(--status-alert)",
        "status-warn": "var(--status-warn)",
        "status-idle": "var(--status-idle)",
        "accent-brand": "var(--accent-brand)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "from": { opacity: "0", transform: "translateY(4px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "slide-in": {
          "from": { opacity: "0", transform: "translateX(-8px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
