import { DeckPanel } from "@/components/Deck";
import type { PaintDiff } from "@/lib/changes";

export const TOTAL_KEYS = 119;

interface SelectionPanelProps {
  paintedCount: number;
  /** Diff against the last successfully applied paint job. */
  paintDiff: PaintDiff;
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

export function SelectionPanel({ paintedCount, paintDiff }: SelectionPanelProps) {
  const filled = Math.round((paintedCount / TOTAL_KEYS) * 100);
  const dirty = paintDiff.added + paintDiff.removed + paintDiff.recolored > 0;

  return (
    <DeckPanel
      title="Seleção"
      aside={<span className="font-mono text-[10px] tabular-nums text-zinc-500">{paintedCount}/{TOTAL_KEYS}</span>}
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary shadow-[0_0_10px_-2px_hsl(var(--primary))] transition-[width] duration-300 [transition-timing-function:var(--ease-out)]" style={{ width: `${filled}%` }} />
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-2">
        <p className="text-[10px] leading-relaxed text-zinc-600">
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
    </DeckPanel>
  );
}
