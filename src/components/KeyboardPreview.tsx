import { useMemo } from "react";
import type { LightingConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

type Key = { label: string; width?: number };

const rows: Key[][] = [
  ["Esc", "", "F1", "F2", "F3", "F4", "", "F5", "F6", "F7", "F8", "", "F9", "F10", "F11", "F12", "", "Prt", "Scr", "Pse"].map((label) => ({ label })),
  [
    { label: "`" }, { label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }, { label: "5" }, { label: "6" }, { label: "7" }, { label: "8" }, { label: "9" }, { label: "0" }, { label: "-" }, { label: "=" }, { label: "Backspace", width: 2 }, { label: "Ins" }, { label: "Home" }, { label: "Pg↑" }, { label: "Num" }, { label: "/" }, { label: "*" }, { label: "-" }
  ],
  [
    { label: "Tab", width: 1.5 }, { label: "Q" }, { label: "W" }, { label: "E" }, { label: "R" }, { label: "T" }, { label: "Y" }, { label: "U" }, { label: "I" }, { label: "O" }, { label: "P" }, { label: "[" }, { label: "]" }, { label: "\\", width: 1.5 }, { label: "Del" }, { label: "End" }, { label: "Pg↓" }, { label: "7" }, { label: "8" }, { label: "9" }, { label: "+" }
  ],
  [
    { label: "Caps", width: 1.8 }, { label: "A" }, { label: "S" }, { label: "D" }, { label: "F" }, { label: "G" }, { label: "H" }, { label: "J" }, { label: "K" }, { label: "L" }, { label: ";" }, { label: "'" }, { label: "Enter", width: 2.2 }, { label: "", width: 3 }, { label: "4" }, { label: "5" }, { label: "6" }, { label: "+" }
  ],
  [
    { label: "Shift", width: 2.4 }, { label: "Z" }, { label: "X" }, { label: "C" }, { label: "V" }, { label: "B" }, { label: "N" }, { label: "M" }, { label: "," }, { label: "." }, { label: "/" }, { label: "Shift", width: 2.6 }, { label: "", width: 1 }, { label: "↑" }, { label: "", width: 1 }, { label: "1" }, { label: "2" }, { label: "3" }, { label: "Ent" }
  ],
  [
    { label: "Ctrl", width: 1.3 }, { label: "Win", width: 1.2 }, { label: "Alt", width: 1.2 }, { label: "Space", width: 6.1 }, { label: "Alt", width: 1.2 }, { label: "Fn", width: 1.2 }, { label: "Menu", width: 1.2 }, { label: "Ctrl", width: 1.3 }, { label: "←" }, { label: "↓" }, { label: "→" }, { label: "0", width: 2 }, { label: "." }, { label: "Ent" }
  ]
];

const palette = (colors: string[]) => colors.length ? colors : ["#ff164d"];

export function KeyboardPreview({ config }: { config: LightingConfig }) {
  const colors = palette(config.colors);
  const flatCount = rows.reduce((total, row) => total + row.length, 0);
  const colorFor = useMemo(() => (index: number) => {
    if (config.effect === "static" || config.effect === "heartbeat") return colors[0];
    if (config.effect === "spectrum") return `hsl(${Math.round((index / flatCount) * 330)} 90% 56%)`;
    if (config.effect === "stack") return colors[Math.floor(index / 22) % colors.length];
    return colors[index % colors.length];
  }, [colors, config.effect, flatCount]);

  let index = 0;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070709] p-4 shadow-2xl shadow-black/50">
      <div className="absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-zinc-500">HyperX Mars</div>
          <div className="mt-1 text-xs text-zinc-400">Pré-visualização por tecla</div>
        </div>
        <div className="flex gap-1.5">
          {colors.slice(0, 5).map((color) => <span key={color} className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />)}
        </div>
      </div>
      <div className={cn("space-y-1.5", config.effect === "heartbeat" && "animate-pulse-soft")}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5">
            {row.map((key, keyIndex) => {
              const current = index++;
              const color = colorFor(current);
              if (!key.label) return <div key={keyIndex} className="h-8" style={{ flex: key.width ?? 1 }} />;
              return (
                <div
                  key={`${key.label}-${keyIndex}`}
                  className="relative flex h-8 min-w-0 items-center justify-center overflow-hidden rounded-[5px] border border-white/[0.09] bg-zinc-900 text-[8px] font-medium text-zinc-300 shadow-[inset_0_-2px_0_rgba(0,0,0,.45)]"
                  style={{ flex: key.width ?? 1 }}
                >
                  <span className="relative z-10 truncate px-1">{key.label}</span>
                  <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full opacity-90" style={{ backgroundColor: color, boxShadow: `0 -2px 9px ${color}` }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
