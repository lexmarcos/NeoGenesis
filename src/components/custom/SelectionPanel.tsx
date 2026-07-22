import { Eraser, LoaderCircle, Play, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaintDiff } from "@/lib/changes";

export const TOTAL_KEYS = 119;

interface SelectionPanelProps {
  paintedCount: number;
  /** Distinct painted colors with key counts, most used first. */
  colorUsage: [string, number][];
  /** Diff against the last successfully applied paint job. */
  paintDiff: PaintDiff;
  applyingCustom: boolean;
  busy: boolean;
  connected: boolean;
  error: string | null;
  onClear: () => void;
  onApply: () => void;
}

function DiffStat({ value, label, className }: { value: number; label: string; className: string }) {
  if (value === 0) return null;
  return (
    <span className={`font-mono text-[10px] font-semibold ${className}`}>
      {label}
      {value}
    </span>
  );
}

export function SelectionPanel({ paintedCount, colorUsage, paintDiff, applyingCustom, busy, connected, error, onClear, onApply }: SelectionPanelProps) {
  const filled = Math.round((paintedCount / TOTAL_KEYS) * 100);
  const dirty = paintDiff.added + paintDiff.removed + paintDiff.recolored > 0;

  return (
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
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[10px] text-zinc-600">
              {paintedCount === 0 ? "Pinte ao menos uma posição para habilitar a aplicação." : "Teclas sem cor ficam apagadas no teclado."}
            </p>
            {dirty && (
              <span className="flex shrink-0 items-center gap-1.5" title="Mudanças desde a última aplicação">
                <DiffStat value={paintDiff.added} label="+" className="text-emerald-400" />
                <DiffStat value={paintDiff.removed} label="−" className="text-red-400" />
                <DiffStat value={paintDiff.recolored} label="~" className="text-amber-400" />
              </span>
            )}
          </div>
        </div>

        {colorUsage.length > 0 && (
          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Cores em uso</div>
            <ul className="space-y-1">
              {colorUsage.map(([color, count]) => (
                <li key={color} className="flex items-center gap-2 text-[11px]">
                  <span className="h-3.5 w-3.5 rounded-[4px] border border-white/15" style={{ backgroundColor: color, boxShadow: `0 0 8px -2px ${color}` }} />
                  <span className="font-mono uppercase text-zinc-400">{color}</span>
                  <span className="ml-auto font-mono text-[10px] text-zinc-600">{count} {count === 1 ? "tecla" : "teclas"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClear} disabled={paintedCount === 0}><Eraser className="mr-2 h-3.5 w-3.5" />Limpar</Button>
          <Button size="sm" className="flex-1" onClick={onApply} disabled={busy || !connected || paintedCount === 0} title={!connected ? "Conecte o teclado" : paintedCount === 0 ? "Pinte ao menos uma tecla" : undefined}>
            {applyingCustom ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5 fill-current" />}
            Aplicar
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] p-3 animate-fade-in">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            <p className="select-text whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-red-200">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
