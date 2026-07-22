import { TriangleAlert } from "lucide-react";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { KeyboardChassis } from "@/components/KeyboardChassis";
import { Deck } from "@/components/Deck";
import { BrushPanel } from "@/components/custom/BrushPanel";
import { SelectionPanel, TOTAL_KEYS } from "@/components/custom/SelectionPanel";
import { UsedColorsPanel } from "@/components/custom/UsedColorsPanel";
import type { PaintDiff } from "@/lib/changes";
import type { KeyDecorator } from "@/lib/keymap";

interface PerKeyTabProps {
  colors: Record<number, string>;
  brush: string;
  onBrush: (color: string) => void;
  onKeyClick: (key: KeyDecorator) => void;
  paintedCount: number;
  paintDiff: PaintDiff;
  error: string | null;
}

export function PerKeyTab({ colors, brush, onBrush, onKeyClick, paintedCount, paintDiff, error }: PerKeyTabProps) {
  const usage = new Map<string, number>();
  for (const color of Object.values(colors)) {
    const key = color.toLowerCase();
    usage.set(key, (usage.get(key) ?? 0) + 1);
  }
  const colorUsage = [...usage.entries()].sort((a, b) => b[1] - a[1]);
  const usedColors = colorUsage.map(([color]) => color);

  return (
    <div className="space-y-4">
      <KeyboardChassis glow={usedColors.length ? usedColors : [brush]}>
        <CustomKeyboard colors={colors} onKeyClick={onKeyClick} />
      </KeyboardChassis>

      <Deck className="grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <BrushPanel brush={brush} onBrush={onBrush} />
        <SelectionPanel paintedCount={paintedCount} paintDiff={paintDiff} />
        <UsedColorsPanel colorUsage={colorUsage} brush={brush} onBrush={onBrush} />
      </Deck>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.07] p-3 animate-fade-in">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <p className="select-text whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
