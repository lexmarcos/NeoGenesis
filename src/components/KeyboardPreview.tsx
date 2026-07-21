import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { LightingConfig } from "@/lib/types";
import { KeyboardChassis } from "@/components/KeyboardChassis";
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

const palette = (colors: string[]) => (colors.length ? colors : ["#ff164d"]);

// Map the 1..5 speed slider to animation durations (higher speed = faster).
const fxDurations = (speed: number) => ({
  sweep: `${(6 - speed) * 0.55 + 0.4}s`,
  hue: `${(6 - speed) * 1.3 + 1.2}s`,
  beat: `${(6 - speed) * 0.26 + 0.72}s`
});

export function KeyboardPreview({ config }: { config: LightingConfig }) {
  const colors = palette(config.colors);
  const flatCount = rows.reduce((total, row) => total + row.length, 0);
  const fx = fxDurations(config.speed);
  const opacity = 0.35 + (config.brightness / 5) * 0.65;

  const colorFor = useMemo(() => (index: number) => {
    if (config.effect === "static" || config.effect === "heartbeat") return colors[0];
    if (config.effect === "spectrum") return `hsl(${Math.round((index / flatCount) * 330)} 92% 58%)`;
    if (config.effect === "stack") return colors[Math.floor(index / 22) % colors.length];
    return colors[index % colors.length];
  }, [colors, config.effect, flatCount]);

  const vertical = config.direction === "up" || config.direction === "down";
  const reverse = config.direction === "left" || config.direction === "up";
  const showSweep = config.effect === "wave" || config.effect === "stack";
  const isSpectrum = config.effect === "spectrum";
  const isHeartbeat = config.effect === "heartbeat";

  let index = 0;
  return (
    <KeyboardChassis
      breathe
      glow={isSpectrum ? ["#ff2d55", "#ffd60a", "#34d399", "#22d3ee", "#6366f1", "#d946ef"] : colors.slice(0, 5)}
      title="HyperX Mars"
      subtitle="Pré-visualização ao vivo"
      right={
        <div className="flex items-center gap-1.5">
          {(isSpectrum ? ["#ff2d55", "#ffd60a", "#34d399", "#22d3ee", "#6366f1"] : colors.slice(0, 5)).map((color, i) => (
            <span key={`${color}-${i}`} className="h-2 w-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          ))}
        </div>
      }
    >
      <div
        className="relative"
        style={{ "--fx-duration": isHeartbeat ? fx.beat : isSpectrum ? fx.hue : fx.sweep } as CSSProperties}
      >
        <div
          className={cn(
            "space-y-1.5",
            isSpectrum && "animate-hue",
            isHeartbeat && "animate-heartbeat"
          )}
          style={{ opacity }}
        >
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1.5">
              {row.map((key, keyIndex) => {
                const current = index++;
                const color = colorFor(current);
                if (!key.label) return <div key={keyIndex} className="h-8" style={{ flex: key.width ?? 1 }} />;
                return (
                  <div
                    key={`${key.label}-${keyIndex}`}
                    className="relative flex h-8 min-w-0 items-center justify-center overflow-hidden rounded-[6px] border border-white/[0.08] bg-gradient-to-b from-zinc-800/80 to-zinc-950 text-[8px] font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,.06),inset_0_-3px_6px_rgba(0,0,0,.5)]"
                    style={{ flex: key.width ?? 1 }}
                  >
                    {/* Backlight bleeding up through the keycap. */}
                    <span className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(120% 90% at 50% 118%, ${color}, transparent 70%)` }} />
                    <span className="relative z-10 truncate px-1 [text-shadow:0_1px_1px_rgba(0,0,0,.8)]">{key.label}</span>
                    <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 9px ${color}, 0 -1px 6px ${color}` }} />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Moving light sweep for wave / stack effects. */}
          {showSweep && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-y-0 animate-sweep mix-blend-screen"
                style={{
                  [vertical ? "left" : "top"]: 0,
                  [vertical ? "right" : "bottom"]: 0,
                  [vertical ? "height" : "width"]: "45%",
                  background: vertical
                    ? "linear-gradient(180deg, transparent, rgba(255,255,255,.28), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent)",
                  animationDirection: reverse ? "reverse" : "normal"
                }}
              />
            </div>
          )}
        </div>

        {/* Decorative LED underbar, echoing the physical light strip. */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full">
          <div
            className={cn("h-full w-full", isSpectrum ? "bg-spectrum animate-spectrum-pan bg-[length:200%_100%]" : "")}
            style={
              isSpectrum
                ? undefined
                : { background: `linear-gradient(90deg, ${colors.map((c) => c).join(", ")})`, opacity: 0.8 }
            }
          />
        </div>
      </div>
    </KeyboardChassis>
  );
}
