import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Effect } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A living thumbnail for each effect: a tiny board (3 rows of keys + LED
 * strip) running the same motion language as the real preview — the light
 * travels in the cells' own colors, never as a gloss overlay.
 */

const COLS = 12;
const ROWS = 3;
const TRAVEL_SECONDS = 2.8;

interface EffectThumbProps {
  effect: Effect;
  colors: string[];
  className?: string;
}

export function EffectThumb({ effect, colors, className }: EffectThumbProps) {
  const palette = colors.length ? colors : ["#ff164d"];
  const traveling = effect === "wave" || effect === "stack";

  const colorAt = useMemo(
    () => (col: number, row: number) => {
      if (effect === "static" || effect === "heartbeat") return palette[0];
      if (effect === "spectrum") return `hsl(${Math.round((col / COLS) * 330)} 92% 58%)`;
      if (effect === "stack") return palette[row % palette.length];
      return palette[Math.min(palette.length - 1, Math.floor((col / COLS) * palette.length))];
    },
    [effect, palette]
  );

  const travelStyle = (col: number, row: number): CSSProperties => {
    if (!traveling) return {};
    const fraction = effect === "stack" ? row / ROWS : col / COLS;
    return {
      animation: `${effect === "stack" ? "key-stack" : "key-travel"} ${TRAVEL_SECONDS}s linear infinite`,
      animationDelay: `${-fraction * TRAVEL_SECONDS}s`
    };
  };

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/[0.06] bg-black/50 p-1.5",
        effect === "spectrum" && "animate-hue",
        effect === "heartbeat" && "animate-heartbeat",
        className
      )}
      style={{ "--fx-duration": effect === "heartbeat" ? "1.6s" : effect === "spectrum" ? "5s" : `${TRAVEL_SECONDS}s` } as CSSProperties}
    >
      <div className="flex h-full flex-col justify-between gap-[3px]">
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="flex flex-1 gap-[3px]">
            {Array.from({ length: COLS }, (_, col) => {
              const color = colorAt(col, row);
              return (
                <span
                  key={col}
                  className="min-w-0 flex-1 rounded-[2px]"
                  style={{
                    background: `linear-gradient(180deg, ${color}33, ${color}0f), linear-gradient(180deg, #26262e, #131318)`,
                    boxShadow: `inset 0 -1.5px 0 ${color}`,
                    ...travelStyle(col, row)
                  }}
                />
              );
            })}
          </div>
        ))}
        {/* LED strip */}
        <div className="flex gap-[2px] px-6 pt-[1px]">
          {Array.from({ length: 8 }, (_, i) => {
            const color = effect === "spectrum" ? `hsl(${Math.round((i / 8) * 330)} 92% 58%)` : palette[i % palette.length];
            return (
              <span
                key={i}
                className="h-[2px] flex-1 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}`, ...travelStyle(i, 0) }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
