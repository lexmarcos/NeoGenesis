import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KeyboardChassisProps {
  /** Colors that feed the ambient underglow beneath the board. */
  glow: string[];
  /** Optional plate label. Omit it and the bezel goes bare, like real hardware. */
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Let the underglow breathe (effect preview) vs. hold steady (per-key). */
  breathe?: boolean;
}

/**
 * The signature surface of the app: the Mars rendered as hardware — brushed
 * top plate, machined bezel, hairline highlights, and an RGB underglow that
 * sits in normal flow beneath the board so it never smears over the content
 * below it. Shared by the effect preview and the per-key painter so both
 * read as the same physical device.
 */
export function KeyboardChassis({ glow, title, subtitle, right, children, className, breathe }: KeyboardChassisProps) {
  const stops = glow.length ? glow : ["#ff164d"];
  const underglow = stops.length === 1
    ? stops[0]
    : `linear-gradient(90deg, ${stops.map((c, i) => `${c} ${(i / (stops.length - 1)) * 100}%`).join(", ")})`;

  // The board is width-driven (fixed aspect), so on short windows it would
  // grow tall enough to push the control deck off screen. Capping its width
  // against the viewport height makes the board yield instead of the controls:
  // 3.26 is the surface aspect, 56px the bezel, 484px the rest of the shell.
  return (
    <div className={cn("relative mx-auto w-full max-w-[calc((100vh_-_484px)*3.26_+_56px)]", className)}>
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[#14141b] to-[#09090d] p-4 shadow-panel">
        {/* Brushed top plate — the aluminum deck of the Mars. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,.014) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(255,255,255,.01) 0 1px, transparent 1px 2px)"
          }}
        />
        {/* Top hairline catches the light. */}
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        {(title || right) && (
          <div className="relative mb-3 flex items-end justify-between px-1">
            <div>
              {title && <div className="font-display text-[10px] font-semibold uppercase tracking-[0.34em] text-zinc-500">{title}</div>}
              {subtitle && <div className="mt-1 text-xs text-zinc-400">{subtitle}</div>}
            </div>
            {right}
          </div>
        )}
        <div className="relative rounded-xl border border-white/[0.05] bg-black/50 p-3 shadow-[inset_0_2px_14px_rgba(0,0,0,.65)]">
          {children}
        </div>
      </div>

      {/* Ambient underglow cast onto the desk. Rendered in flow, directly
          beneath the chassis, so it can never bleed over sibling sections. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none mx-14 -mt-1.5 h-6 rounded-[50%] blur-2xl",
          breathe ? "animate-underglow" : "opacity-70"
        )}
        style={{
          background: underglow,
          maskImage: "linear-gradient(90deg, transparent, black 18%, black 82%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 18%, black 82%, transparent)"
        }}
      />
    </div>
  );
}
