import { Eraser, LoaderCircle, Paintbrush, Play, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { KeyboardChassis } from "@/components/KeyboardChassis";
import { cn } from "@/lib/utils";
import type { KeyDecorator } from "@/lib/keymap";

const PRESETS = ["#ff164d", "#ff7a00", "#ffd60a", "#34d399", "#22d3ee", "#6366f1", "#d946ef", "#ffffff"];
const TOTAL_KEYS = 119;

interface PerKeyTabProps {
  colors: Record<number, string>;
  brush: string;
  onBrush: (color: string) => void;
  onKeyClick: (key: KeyDecorator) => void;
  onClear: () => void;
  onApply: () => void;
  applyingCustom: boolean;
  busy: boolean;
  connected: boolean;
  paintedCount: number;
  error: string | null;
}

export function PerKeyTab({ colors, brush, onBrush, onKeyClick, onClear, onApply, applyingCustom, busy, connected, paintedCount, error }: PerKeyTabProps) {
  const painted = Array.from(new Set(Object.values(colors)));
  const filled = Math.round((paintedCount / TOTAL_KEYS) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Seleção individual</h2>
        <p className="text-sm text-muted-foreground">Pinte tecla por tecla com a cor do pincel. Clique de novo para limpar uma tecla.</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
        <KeyboardChassis
          glow={painted.length ? painted : [brush]}
          title="HyperX Mars"
          subtitle="Mapa por tecla — clique para pintar"
          right={<span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400">{paintedCount}/{TOTAL_KEYS}</span>}
        >
          <CustomKeyboard colors={colors} onKeyClick={onKeyClick} />
        </KeyboardChassis>

        <div className="space-y-5">
          <Card className="border-white/[0.07] bg-white/[0.02]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm"><Paintbrush className="h-4 w-4 text-primary" />Pincel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="press relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/15" style={{ backgroundColor: brush, boxShadow: `0 0 18px -4px ${brush}` }} title="Cor do pincel">
                  <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={brush} onChange={(event) => onBrush(event.target.value)} />
                </label>
                <div>
                  <div className="text-xs text-zinc-400">Cor atual</div>
                  <div className="font-mono text-sm uppercase tracking-wide">{brush}</div>
                </div>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onBrush(color)}
                    title={color}
                    className={cn("press h-6 w-full rounded-md border transition-transform", brush.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-white/30" : "border-white/15 hover:border-white/40")}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.07] bg-white/[0.02]">
            <CardHeader className="pb-4"><CardTitle className="text-sm">Seleção</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-400">Teclas pintadas</span>
                  <span className="font-mono text-zinc-500">{paintedCount}/{TOTAL_KEYS}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-300 [transition-timing-function:var(--ease-out)]" style={{ width: `${filled}%` }} />
                </div>
                <p className="mt-2 text-[10px] text-zinc-600">
                  {paintedCount === 0 ? "Pinte ao menos uma posição para habilitar a aplicação." : "Teclas sem cor ficam apagadas no teclado."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={onClear} disabled={paintedCount === 0}><Eraser className="mr-2 h-3.5 w-3.5" />Limpar</Button>
                <Button size="sm" className="flex-1" onClick={onApply} disabled={busy || !connected || paintedCount === 0} title={!connected ? "Conecte o teclado" : paintedCount === 0 ? "Pinte ao menos uma tecla" : undefined}>
                  {applyingCustom ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5 fill-current" />}
                  Aplicar
                </Button>
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] p-3">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <p className="select-text whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-red-200">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
