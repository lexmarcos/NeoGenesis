import { CustomKeyboard } from "@/components/CustomKeyboard";
import { KeyboardChassis } from "@/components/KeyboardChassis";
import { BrushPanel } from "@/components/custom/BrushPanel";
import { SelectionPanel, TOTAL_KEYS } from "@/components/custom/SelectionPanel";
import type { PaintDiff } from "@/lib/changes";
import type { KeyDecorator } from "@/lib/keymap";

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
  paintDiff: PaintDiff;
  error: string | null;
}

export function PerKeyTab({ colors, brush, onBrush, onKeyClick, onClear, onApply, applyingCustom, busy, connected, paintedCount, paintDiff, error }: PerKeyTabProps) {
  const usage = new Map<string, number>();
  for (const color of Object.values(colors)) {
    const key = color.toLowerCase();
    usage.set(key, (usage.get(key) ?? 0) + 1);
  }
  const colorUsage = [...usage.entries()].sort((a, b) => b[1] - a[1]);
  const usedColors = colorUsage.map(([color]) => color);

  return (
    <div className="flex h-full flex-col space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Seleção individual</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Pinte tecla por tecla com a cor do pincel. Clique de novo para limpar uma tecla.</p>
      </div>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_300px] items-center gap-6">
        <KeyboardChassis
          glow={usedColors.length ? usedColors : [brush]}
          title="HyperX Mars"
          subtitle="Mapa por tecla — clique para pintar"
          right={<span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] tabular-nums text-zinc-400">{paintedCount}/{TOTAL_KEYS}</span>}
        >
          <CustomKeyboard colors={colors} onKeyClick={onKeyClick} />
        </KeyboardChassis>

        <div className="space-y-5">
          <BrushPanel brush={brush} onBrush={onBrush} usedColors={usedColors} />
          <SelectionPanel
            paintedCount={paintedCount}
            colorUsage={colorUsage}
            paintDiff={paintDiff}
            applyingCustom={applyingCustom}
            busy={busy}
            connected={connected}
            error={error}
            onClear={onClear}
            onApply={onApply}
          />
        </div>
      </div>
    </div>
  );
}
