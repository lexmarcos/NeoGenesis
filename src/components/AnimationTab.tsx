import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Gauge, Layers3, LoaderCircle, Palette, Play, Save, Sparkles, SunMedium, Waves } from "lucide-react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { KeyboardPreview } from "@/components/KeyboardPreview";
import { cn } from "@/lib/utils";
import type { Direction, Effect, LightingConfig } from "@/lib/types";

export const EFFECTS: { id: Effect; label: string; description: string; icon: typeof Waves }[] = [
  { id: "wave", label: "Onda RGB", description: "Varredura colorida", icon: Waves },
  { id: "stack", label: "Loading de cor", description: "Cores em camadas", icon: Layers3 },
  { id: "static", label: "Sólida", description: "Uma cor constante", icon: SunMedium },
  { id: "heartbeat", label: "Batimento", description: "Pulso duplo", icon: Activity },
  { id: "spectrum", label: "Ciclo de cores", description: "Espectro contínuo", icon: Sparkles }
];

const directions: { id: Direction; icon: typeof ArrowUp; label: string }[] = [
  { id: "up", icon: ArrowUp, label: "Cima" },
  { id: "left", icon: ArrowLeft, label: "Esquerda" },
  { id: "right", icon: ArrowRight, label: "Direita" },
  { id: "down", icon: ArrowDown, label: "Baixo" }
];

interface AnimationTabProps {
  config: LightingConfig;
  onSelectEffect: (effect: Effect) => void;
  onUpdate: <K extends keyof LightingConfig>(key: K, value: LightingConfig[K]) => void;
  onSave: () => void;
  onApply: () => void;
  applying: boolean;
  busy: boolean;
  connected: boolean;
}

export function AnimationTab({ config, onSelectEffect, onUpdate, onSave, onApply, applying, busy, connected }: AnimationTabProps) {
  const visibleColors = config.effect === "static" ? 1 : config.effect === "heartbeat" ? 2 : config.effect === "spectrum" || config.effect === "wave" ? 0 : 5;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Animação</h2>
          <p className="text-sm text-muted-foreground">Um efeito para todo o teclado, gravado na memória do Mars.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onSave}><Save className="mr-2 h-4 w-4" />Salvar</Button>
          <Button className="min-w-36" onClick={onApply} disabled={busy || !connected} title={!connected ? "Conecte o teclado para aplicar" : undefined}>
            {applying ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
            Aplicar no Mars
          </Button>
        </div>
      </div>

      <KeyboardPreview config={config} />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Efeito de iluminação</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {EFFECTS.map((effect, i) => {
              const Icon = effect.icon;
              const active = effect.id === config.effect;
              return (
                <button
                  key={effect.id}
                  onClick={() => onSelectEffect(effect.id)}
                  style={{ animationDelay: `${i * 45}ms` } as CSSProperties}
                  className={cn(
                    "press group relative animate-fade-in-up overflow-hidden rounded-xl border p-4 text-left",
                    "transition-[border-color,background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)]",
                    active
                      ? "border-primary/50 bg-primary/[0.07] shadow-[0_0_30px_-10px_hsl(var(--primary)/.7)]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn("mb-6 grid h-9 w-9 place-items-center rounded-lg border transition-colors", active ? "border-primary/40 bg-primary/15 text-primary" : "border-white/[0.06] bg-white/[0.03] text-zinc-400")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{effect.label}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">{effect.description}</div>
                  {active && (
                    <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary))]">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
                      <span className="absolute inset-x-1 bottom-1 truncate text-center font-mono text-[7px] uppercase text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">{color.slice(1)}</span>
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
            <CardContent className="space-y-7">
              <div>
                <div className="mb-3 flex justify-between text-xs"><span className="text-zinc-400">Brilho</span><span className="font-mono text-zinc-500">{config.brightness}/5</span></div>
                <Slider min={1} max={5} step={1} value={[config.brightness]} onValueChange={([value]) => onUpdate("brightness", value)} />
              </div>
              {config.effect !== "static" && (
                <div>
                  <div className="mb-3 flex justify-between text-xs"><span className="text-zinc-400">Velocidade</span><span className="font-mono text-zinc-500">{config.speed}/5</span></div>
                  <Slider min={1} max={5} step={1} value={[config.speed]} onValueChange={([value]) => onUpdate("speed", value)} />
                </div>
              )}
              {(config.effect === "wave" || config.effect === "stack") && (
                <div>
                  <div className="mb-3 text-xs text-zinc-400">Direção</div>
                  <div className="grid grid-cols-4 gap-2">
                    {directions.map(({ id, icon: Icon, label }) => (
                      <button key={id} title={label} onClick={() => onUpdate("direction", id)} className={cn("press grid h-9 place-items-center rounded-md border transition-colors", config.direction === id ? "border-primary/50 bg-primary/10 text-primary" : "border-white/[0.08] text-zinc-500 hover:text-zinc-300")}>
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
        </div>
      </div>
    </div>
  );
}
