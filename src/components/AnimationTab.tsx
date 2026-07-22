import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Deck, DeckPanel } from "@/components/Deck";
import { KeyboardPreview } from "@/components/KeyboardPreview";
import { EffectSelect } from "@/components/effects/EffectSelect";
import { cn } from "@/lib/utils";
import type { ChangeEntry } from "@/lib/changes";
import type { Direction, Effect, LightingConfig } from "@/lib/types";

const directions: { id: Direction; icon: typeof ArrowUp; label: string }[] = [
  { id: "up", icon: ArrowUp, label: "Cima" },
  { id: "left", icon: ArrowLeft, label: "Esquerda" },
  { id: "right", icon: ArrowRight, label: "Direita" },
  { id: "down", icon: ArrowDown, label: "Baixo" }
];

function Readout({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.08] bg-black/40 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-zinc-400">
      {children}
    </span>
  );
}

interface AnimationTabProps {
  config: LightingConfig;
  effectConfigs: Record<Effect, LightingConfig>;
  changes: ChangeEntry[];
  onSelectEffect: (effect: Effect) => void;
  onUpdate: <K extends keyof LightingConfig>(key: K, value: LightingConfig[K]) => void;
}

export function AnimationTab({ config, effectConfigs, changes, onSelectEffect, onUpdate }: AnimationTabProps) {
  // How many palette slots the firmware actually reads for this effect —
  // wave and spectrum generate their own colors on the device.
  const visibleColors = config.effect === "static" ? 1 : config.effect === "heartbeat" ? 2 : config.effect === "spectrum" || config.effect === "wave" ? 0 : 5;
  const dirty = new Set(changes.map((entry) => entry.effect));

  return (
    <div className="space-y-4">
      <KeyboardPreview config={config} />

      <Deck className="grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <DeckPanel
          title="Efeito"
          aside={visibleColors > 0 ? <span className="font-mono text-[10px] text-zinc-600">{visibleColors} {visibleColors === 1 ? "cor" : "cores"}</span> : null}
        >
          <EffectSelect value={config.effect} dirty={dirty} onChange={onSelectEffect} />

          <div className="mt-3">
            {visibleColors === 0 ? (
              <div className="rounded-lg bg-spectrum bg-[length:200%_100%] p-[1px] animate-spectrum-pan">
                <div className="rounded-[7px] bg-zinc-950/90 px-3 py-2.5 text-center text-[11px] text-zinc-400">Paleta gerada pelo firmware</div>
              </div>
            ) : (
              // Always a 5-up grid so a swatch keeps the same size on every
              // effect, however many slots the firmware actually reads.
              <div className="grid grid-cols-5 gap-2">
                {config.colors.slice(0, visibleColors).map((color, index) => (
                  <label
                    key={index}
                    className="press group relative h-10 cursor-pointer overflow-hidden rounded-lg border border-white/10"
                    style={{ backgroundColor: color, boxShadow: `inset 0 -10px 22px rgba(0,0,0,.22), 0 0 14px -4px ${color}` }}
                    title={`Cor ${index + 1}`}
                  >
                    <input
                      type="color"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      value={color}
                      onChange={(event) => { const next = [...config.colors]; next[index] = event.target.value; onUpdate("colors", next); }}
                    />
                    <span className="absolute inset-x-1 bottom-1 truncate text-center font-mono text-[8px] uppercase text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">{color.slice(1)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </DeckPanel>

        <DeckPanel title="Ajustes">
          {/* Two-up: the two meters share a row, then direction and looping
              share the next — the bay fills its width instead of stacking. */}
          <div className="grid grid-cols-2 items-start gap-x-5 gap-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-zinc-400">Brilho</span><Readout>{config.brightness} / 5</Readout></div>
              <Slider ticks min={1} max={5} step={1} value={[config.brightness]} onValueChange={([value]) => onUpdate("brightness", value)} />
            </div>

            {config.effect !== "static" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-zinc-400">Velocidade</span><Readout>{config.speed} / 5</Readout></div>
                <Slider ticks min={1} max={5} step={1} value={[config.speed]} onValueChange={([value]) => onUpdate("speed", value)} />
              </div>
            )}

            {(config.effect === "wave" || config.effect === "stack") && (
              <div className="col-start-1">
                <div className="mb-1.5 text-xs text-zinc-400">Direção</div>
                <div className="grid grid-cols-4 gap-2">
                  {directions.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      title={label}
                      aria-label={label}
                      aria-pressed={config.direction === id}
                      onClick={() => onUpdate("direction", id)}
                      className={cn(
                        "press grid h-9 place-items-center rounded-md border transition-colors duration-200 [transition-timing-function:var(--ease-out)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                        config.direction === id
                          ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_14px_-4px_hsl(var(--primary))]"
                          : "border-white/[0.08] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(config.effect === "heartbeat" || config.effect === "stack") && (
              <div className="flex items-center justify-between gap-3 self-end rounded-lg border border-white/[0.06] px-3 py-2">
                <div>
                  <div className="text-xs font-medium">Repetição contínua</div>
                  <div className="mt-0.5 text-[10px] text-zinc-600">Mantém o efeito em loop</div>
                </div>
                <Switch checked={config.loopMode} onCheckedChange={(value) => onUpdate("loopMode", value)} />
              </div>
            )}
          </div>
        </DeckPanel>
      </Deck>
    </div>
  );
}
