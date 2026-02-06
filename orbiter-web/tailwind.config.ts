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
        "bg-elevated": "var(--bg-elevated)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        "border-accent": "var(--border-accent)",
        "text-bright": "var(--text-bright)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-dim": "var(--text-dim)",
        "status-active": "var(--status-active)",
        "status-success": "var(--status-success)",
        "status-alert": "var(--status-alert)",
        "status-warn": "var(--status-warn)",
        "status-info": "var(--status-info)",
        "accent-primary": "var(--accent-primary)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-tertiary": "var(--accent-tertiary)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in": "slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-from-top": "slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "from": { opacity: "0", transform: "translateY(8px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "from": { opacity: "0", transform: "translateX(-12px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        slideInUp: {
          "from": { opacity: "0", transform: "translateY(12px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 12px rgba(0, 217, 255, 0.3)" },
          "50%": { opacity: "0.7", boxShadow: "0 0 20px rgba(0, 217, 255, 0.5)" },
        },
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(0, 217, 255, 0.3)",
        "glow-primary-lg": "0 0 40px rgba(0, 217, 255, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
