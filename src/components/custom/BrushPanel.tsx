import { DeckPanel } from "@/components/Deck";
import { cn } from "@/lib/utils";

const PRESETS = ["#ff164d", "#ff7a00", "#ffd60a", "#34d399", "#22d3ee", "#6366f1", "#d946ef", "#ffffff"];

interface BrushPanelProps {
  brush: string;
  onBrush: (color: string) => void;
}

export function BrushPanel({ brush, onBrush }: BrushPanelProps) {
  return (
    <DeckPanel title="Pincel" aside={<span className="font-mono text-[10px] uppercase text-zinc-500">{brush}</span>}>
      <div className="flex items-center gap-3">
        {/* The loaded color, kept apart from the presets by a hairline so the
            well never reads as a ninth swatch. */}
        <label
          className="press relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-white/25 transition-[box-shadow] duration-200"
          style={{ backgroundColor: brush, boxShadow: `0 0 20px -4px ${brush}` }}
          title="Escolher a cor do pincel"
        >
          <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={brush} onChange={(event) => onBrush(event.target.value)} />
        </label>

        <span aria-hidden className="h-10 w-px shrink-0 bg-white/[0.08]" />

        <div className="grid min-w-0 flex-1 grid-cols-8 gap-1.5">
          {PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => onBrush(color)}
              title={color}
              aria-label={`Usar ${color}`}
              className={cn(
                "press h-6 w-full rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                brush.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-white/30" : "border-white/15 hover:border-white/40"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </DeckPanel>
  );
}
