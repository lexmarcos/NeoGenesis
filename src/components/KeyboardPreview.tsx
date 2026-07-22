import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { LightingConfig } from "@/lib/types";
import { KEY_DECORATORS, KEYMAP_SURFACE, type KeyDecorator } from "@/lib/keymap";
import { legendOf } from "@/lib/legends";
import { KeyboardChassis } from "@/components/KeyboardChassis";
import { cn } from "@/lib/utils";

/**
 * Live effect preview rendered on the real Mars geometry (the same
 * KEY_DECORATORS surface the per-key painter uses): exact key sizes, exact
 * gaps, and the 15-segment LED bar at the front edge.
 *
 * The wave/stack motion is carried by the key colors themselves — each key
 * brightens with a delay proportional to its position along the sweep axis,
 * so a light front travels across the board. No gloss overlay on top.
 */

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const palette = (colors: string[]) => (colors.length ? colors : ["#ff164d"]);

/** Interpolate the palette smoothly instead of hard-banding it. */
const hexLerp = (a: string, b: string, t: number): string => {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
};

const paletteAt = (colors: string[], t: number): string => {
  if (colors.length === 1) return colors[0];
  const position = Math.min(0.9999, Math.max(0, t)) * (colors.length - 1);
  const index = Math.floor(position);
  return hexLerp(colors[index], colors[index + 1], position - index);
};

// Map the 1..5 speed slider to animation durations (higher speed = faster).
const fxDurations = (speed: number) => ({
  sweep: (6 - speed) * 0.55 + 0.4,
  hue: `${(6 - speed) * 1.3 + 1.2}s`,
  beat: `${(6 - speed) * 0.26 + 0.72}s`
});

const KEY_AREA_BOTTOM = 212; // keys live above the LED bar band

export function KeyboardPreview({ config }: { config: LightingConfig }) {
  const colors = palette(config.colors);
  const fx = fxDurations(config.speed);
  const opacity = 0.35 + (config.brightness / 5) * 0.65;

  const isSpectrum = config.effect === "spectrum";
  const isHeartbeat = config.effect === "heartbeat";
  const traveling = config.effect === "wave" || config.effect === "stack";
  const vertical = config.direction === "up" || config.direction === "down";
  const reverse = config.direction === "left" || config.direction === "up";

  const colorFor = useMemo(
    () => (key: KeyDecorator, segment: number) => {
      const xFraction = (key.x + key.w / 2) / KEYMAP_SURFACE.width;
      if (config.effect === "static" || config.effect === "heartbeat") return colors[0];
      if (config.effect === "spectrum") return `hsl(${Math.round(xFraction * 330)} 92% 58%)`;
      if (config.effect === "stack") {
        if (key.row === 7) return colors[segment % colors.length];
        const band = Math.min(colors.length - 1, Math.floor((key.y / KEY_AREA_BOTTOM) * colors.length));
        return colors[band];
      }
      // wave: a smooth palette gradient the brightness front travels across
      return paletteAt(colors, xFraction);
    },
    [colors, config.effect]
  );

  /** Position along the sweep axis, 0..1 — the animation delay for the key. */
  const axisFraction = (key: KeyDecorator) =>
    vertical
      ? (key.y + key.h / 2) / KEY_AREA_BOTTOM
      : (key.x + key.w / 2) / KEYMAP_SURFACE.width;

  const travelStyle = (key: KeyDecorator): CSSProperties =>
    traveling
      ? {
          animation: `${config.effect === "stack" ? "key-stack" : "key-travel"} ${fx.sweep}s linear infinite`,
          animationDelay: `${-axisFraction(key) * fx.sweep}s`,
          animationDirection: reverse ? "reverse" : "normal"
        }
      : {};

  // The desk underglow mirrors what the board actually shows: a single color
  // for static, the pulse pair for heartbeat, the palette for the rest.
  const glow =
    config.effect === "static" ? [colors[0]]
    : isHeartbeat ? colors.slice(0, 2)
    : isSpectrum ? ["#ff2d55", "#ffd60a", "#34d399", "#22d3ee", "#6366f1", "#d946ef"]
    : colors.slice(0, 5);

  let segment = 0;
  return (
    <KeyboardChassis
      breathe
      glow={glow}
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
        className="relative w-full select-none"
        style={{
          aspectRatio: `${KEYMAP_SURFACE.width} / ${KEYMAP_SURFACE.height}`,
          "--fx-duration": isHeartbeat ? fx.beat : isSpectrum ? fx.hue : `${fx.sweep}s`
        } as CSSProperties}
      >
        <div
          className={cn("absolute inset-0", isSpectrum && "animate-hue", isHeartbeat && "animate-heartbeat")}
          style={{ opacity }}
        >
          {KEY_DECORATORS.map((key) => {
            const color = colorFor(key, segment);
            if (key.row === 7) {
              segment++;
              return (
                <div
                  key={`bar-${key.row}-${key.col}`}
                  className="absolute rounded-full"
                  style={{
                    left: pct(key.x, KEYMAP_SURFACE.width),
                    top: pct(key.y, KEYMAP_SURFACE.height),
                    width: pct(key.w, KEYMAP_SURFACE.width),
                    height: pct(key.h, KEYMAP_SURFACE.height),
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}, 0 0 2px ${color}`,
                    ...travelStyle(key)
                  }}
                />
              );
            }
            return (
              <div
                key={`${key.row}-${key.col}`}
                className="absolute flex items-center justify-center overflow-hidden rounded-[5px] border border-white/[0.08] bg-gradient-to-b from-zinc-800/90 to-zinc-950 text-[8px] font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,.06),inset_0_-3px_6px_rgba(0,0,0,.5)]"
                style={{
                  left: pct(key.x, KEYMAP_SURFACE.width),
                  top: pct(key.y, KEYMAP_SURFACE.height),
                  width: pct(key.w, KEYMAP_SURFACE.width),
                  height: pct(key.h, KEYMAP_SURFACE.height),
                  ...travelStyle(key)
                }}
              >
                {/* Backlight bleeding up through the keycap. */}
                <span className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(120% 90% at 50% 118%, ${color}, transparent 70%)` }} />
                <span className="relative z-10 truncate px-0.5 [text-shadow:0_1px_1px_rgba(0,0,0,.8)]">{legendOf(key.label)}</span>
                <span className="absolute inset-x-0.5 bottom-0 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 9px ${color}, 0 -1px 6px ${color}` }} />
              </div>
            );
          })}
        </div>
      </div>
    </KeyboardChassis>
  );
}
