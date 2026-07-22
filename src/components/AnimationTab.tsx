import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gauge, LoaderCircle, Palette, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { KeyboardPreview } from "@/components/KeyboardPreview";
import { EffectCard } from "@/components/effects/EffectCard";
import { EFFECTS } from "@/components/effects/effects";
import { ChangesRail } from "@/components/feedback/ChangesRail";
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
  onRevertEffect: (effect: Effect) => void;
  onRevertAll: () => void;
  onSave: () => void;
  onApply: () => void;
  applying: boolean;
  busy: boolean;
  connected: boolean;
}

export function AnimationTab({ config, effectConfigs, changes, onSelectEffect, onUpdate, onRevertEffect, onRevertAll, onSave, onApply, applying, busy, connected }: AnimationTabProps) {
  const visibleColors = config.effect === "static" ? 1 : config.effect === "heartbeat" ? 2 : config.effect === "spectrum" || config.effect === "wave" ? 0 : 5;
  const dirty = new Set(changes.map((entry) => entry.effect));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Animação</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Um efeito para todo o teclado, gravado na memória do Mars.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onSave} title="Salvar no perfil (Ctrl+S)"><Save className="mr-2 h-4 w-4" />Salvar</Button>
          <Button className="min-w-36" onClick={onApply} disabled={busy || !connected} title={!connected ? "Conecte o teclado para aplicar" : "Gravar no teclado (Ctrl+Enter)"}>
            {applying ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
            Aplicar no Mars
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        {/* Left: the device itself, then the effect strip. */}
        <div className="min-w-0 space-y-5">
          <KeyboardPreview config={config} />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Efeito de iluminação</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
              {EFFECTS.map((effect, i) => (
                <EffectCard
                  key={effect.id}
                  effect={effect.id}
                  label={effect.label}
                  description={effect.description}
                  colors={effectConfigs[effect.id].colors}
                  active={effect.id === config.effect}
                  modified={dirty.has(effect.id)}
                  staggerIndex={i}
                  onSelect={onSelectEffect}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right rail: parameters, then the pending-changes console. */}
        <div className="space-y-5">
          <Card className="border-white/[0.07] bg-white/[0.02]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Cores</CardTitle>
              <CardDescription>Paleta gravada na memória do teclado.</CardDescription>
            </CardHeader>
            <CardContent>
              {visibleColors === 0 ? (
                <div className="rounded-lg bg-spectrum bg-[length:200%_100%] p-[1px] animate-spectrum-pan">
                  <div className="rounded-[7px] bg-zinc-950/90 px-3 py-4 text-center text-xs text-zinc-400">Paleta RGB gerada pelo firmware</div>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {config.colors.slice(0, visibleColors).map((color, index) => (
                    <label key={index} className="press group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10" style={{ backgroundColor: color, boxShadow: `inset 0 -10px 22px rgba(0,0,0,.22), 0 0 14px -4px ${color}` }}>
                      <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={color} onChange={(event) => { const next = [...config.colors]; next[index] = event.target.value; onUpdate("colors", next); }} />
                      <span className="absolute inset-x-1 bottom-1 truncate text-center font-mono text-[8px] uppercase text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">{color.slice(1)}</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.02]">
            <CardHeader className="pb-5">
              <CardTitle className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4 text-primary" />Ajustes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs"><span className="text-zinc-400">Brilho</span><Readout>{config.brightness} / 5</Readout></div>
                <Slider ticks min={1} max={5} step={1} value={[config.brightness]} onValueChange={([value]) => onUpdate("brightness", value)} />
              </div>
              {config.effect !== "static" && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs"><span className="text-zinc-400">Velocidade</span><Readout>{config.speed} / 5</Readout></div>
                  <Slider ticks min={1} max={5} step={1} value={[config.speed]} onValueChange={([value]) => onUpdate("speed", value)} />
                </div>
              )}
              {(config.effect === "wave" || config.effect === "stack") && (
                <div>
                  <div className="mb-2 text-xs text-zinc-400">Direção</div>
                  <div className="grid grid-cols-4 gap-2">
                    {directions.map(({ id, icon: Icon, label }) => (
                      <button key={id} title={label} onClick={() => onUpdate("direction", id)} className={cn("press grid h-9 place-items-center rounded-md border transition-colors", config.direction === id ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_14px_-4px_hsl(var(--primary))]" : "border-white/[0.08] text-zinc-500 hover:text-zinc-300")}>
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(config.effect === "heartbeat" || config.effect === "stack") && (
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-5">
                  <div>
                    <div className="text-xs font-medium">Repetição contínua</div>
                    <div className="mt-1 text-[10px] text-zinc-600">Mantém o efeito em loop</div>
                  </div>
                  <Switch checked={config.loopMode} onCheckedChange={(value) => onUpdate("loopMode", value)} />
                </div>
              )}
            </CardContent>
          </Card>

          <ChangesRail entries={changes} onRevertEffect={onRevertEffect} onRevertAll={onRevertAll} />
        </div>
      </div>
    </div>
  );
}
