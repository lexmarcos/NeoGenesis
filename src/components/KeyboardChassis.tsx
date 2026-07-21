import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KeyboardChassisProps {
  /** Colors that feed the ambient underglow beneath the board. */
  glow: string[];
  title: string;
  subtitle: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Let the underglow breathe (effect preview) vs. hold steady (per-key). */
  breathe?: boolean;
}

/**
 * The signature surface of the app: a dark keyboard chassis with a hairline
 * top highlight, machined bezel, and an RGB underglow that picks up whatever
 * colors are currently in play. Shared by the effect preview and the per-key
 * painter so both read as the same physical device.
 */
export function KeyboardChassis({ glow, title, subtitle, right, children, className, breathe }: KeyboardChassisProps) {
  const stops = glow.length ? glow : ["#ff164d"];
  const underglow = stops.length === 1
    ? stops[0]
    : `linear-gradient(90deg, ${stops.map((c, i) => `${c} ${(i / (stops.length - 1)) * 100}%`).join(", ")})`;

  return (
    <div className={cn("relative", className)}>
      {/* Ambient underglow cast onto the desk beneath the board. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-8 -bottom-6 h-24 rounded-[50%] blur-2xl opacity-60",
          breathe && "animate-underglow"
        )}
        style={{ background: underglow }}
      />
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[#101014] to-[#08080b] p-4 shadow-panel">
        {/* Top hairline catches the light. */}
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="mb-4 flex items-end justify-between px-1">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-zinc-500">{title}</div>
            <div className="mt-1 text-xs text-zinc-400">{subtitle}</div>
          </div>
          {right}
        </div>
        <div className="relative rounded-xl border border-white/[0.05] bg-black/40 p-3 shadow-[inset_0_2px_14px_rgba(0,0,0,.6)]">
          {children}
        </div>
      </div>
    </div>
  );
}
