import type { CSSProperties } from "react";
import { KEY_DECORATORS, KEYMAP_SURFACE, keyIndexOf, type KeyDecorator } from "@/lib/keymap";
import { cn } from "@/lib/utils";

interface CustomKeyboardProps {
  /** keyIndex -> hex color ("#rrggbb") for painted positions only. */
  colors: Record<number, string>;
  onKeyClick: (key: KeyDecorator) => void;
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function CustomKeyboard({ colors, onKeyClick }: CustomKeyboardProps) {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${KEYMAP_SURFACE.width} / ${KEYMAP_SURFACE.height}` }}
    >
      {KEY_DECORATORS.map((key) => {
        const keyIndex = keyIndexOf(key);
        const painted = colors[keyIndex];
        const isBar = key.row === 7;
        const style: CSSProperties = {
          left: pct(key.x, KEYMAP_SURFACE.width),
          top: pct(key.y, KEYMAP_SURFACE.height),
          width: pct(key.w, KEYMAP_SURFACE.width),
          height: pct(key.h, KEYMAP_SURFACE.height),
          backgroundColor: painted,
          boxShadow: painted ? `0 0 10px ${painted}, inset 0 1px 0 rgba(255,255,255,.35)` : undefined
        };
        return (
          <button
            key={keyIndex}
            type="button"
            title={`${key.label || `Barra LED ${key.col - 2}`} · (${key.row}, ${key.col})`}
            onClick={() => onKeyClick(key)}
            className={cn(
              "press absolute flex items-center justify-center overflow-hidden border text-[7px] font-medium",
              "transition-[background-color,border-color,box-shadow,transform] duration-150 [transition-timing-function:var(--ease-out)]",
              isBar ? "rounded-full" : "rounded-[5px]",
              painted
                ? "border-white/50 text-white [text-shadow:0_1px_2px_rgba(0,0,0,.85)]"
                : "border-white/[0.09] bg-gradient-to-b from-zinc-800/70 to-zinc-950 text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,.05),inset_0_-2px_5px_rgba(0,0,0,.5)] hover:border-primary/60 hover:text-zinc-200"
            )}
            style={style}
          >
            {!isBar && <span className="truncate px-0.5">{key.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
