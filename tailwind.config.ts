import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" }
      },
      fontFamily: {
        mono: ["ui-monospace", "\"JetBrains Mono\"", "\"SFMono-Regular\"", "Menlo", "Consolas", "monospace"]
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--primary) / .35), 0 0 32px -6px hsl(var(--primary) / .45)",
        panel: "0 1px 0 0 rgba(255,255,255,.04) inset, 0 24px 60px -24px rgba(0,0,0,.8)"
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        "spectrum-pan": { from: { backgroundPosition: "0% 50%" }, to: { backgroundPosition: "200% 50%" } },
        hue: { from: { filter: "hue-rotate(0deg)" }, to: { filter: "hue-rotate(360deg)" } },
        sweep: { "0%": { transform: "translateX(-140%)" }, "100%": { transform: "translateX(140%)" } },
        heartbeat: { "0%,42%,100%": { opacity: ".5" }, "10%,30%": { opacity: "1" }, "20%": { opacity: ".68" } },
        underglow: { "0%,100%": { opacity: ".5" }, "50%": { opacity: ".85" } },
        pulseSoft: { "0%, 100%": { opacity: "0.6" }, "50%": { opacity: "1" } }
      },
      animation: {
        "fade-in": "fade-in .3s var(--ease-out) both",
        "fade-in-up": "fade-in-up .45s var(--ease-out) both",
        "scale-in": "scale-in .35s var(--ease-out) both",
        "spectrum-pan": "spectrum-pan 7s linear infinite",
        hue: "hue var(--fx-duration, 6s) linear infinite",
        sweep: "sweep var(--fx-duration, 3s) var(--ease-in-out) infinite",
        heartbeat: "heartbeat var(--fx-duration, 1.4s) ease-in-out infinite",
        underglow: "underglow 5s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
