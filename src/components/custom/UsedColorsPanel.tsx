import { DeckPanel } from "@/components/Deck";
import { cn } from "@/lib/utils";

interface UsedColorsPanelProps {
  /** Distinct painted colors with key counts, most used first. */
  colorUsage: [string, number][];
  brush: string;
  /** Rows double as the quick-pick for colors already on the board. */
  onBrush: (color: string) => void;
}

export function UsedColorsPanel({ colorUsage, brush, onBrush }: UsedColorsPanelProps) {
  return (
    <DeckPanel
      title="Cores em uso"
      aside={colorUsage.length > 0 ? <span className="font-mono text-[10px] text-zinc-600">{colorUsage.length}</span> : null}
    >
      {colorUsage.length === 0 ? (
        <p className="text-[10px] leading-relaxed text-zinc-600">O teclado ainda está sem pintura. Escolha uma cor no pincel e clique nas teclas.</p>
      ) : (
        <ul className="-mr-2 max-h-[8.5rem] space-y-0.5 overflow-y-auto pr-2">
          {colorUsage.map(([color, count]) => (
            <li key={color}>
              <button
                onClick={() => onBrush(color)}
                title={`Carregar ${color} no pincel`}
                className={cn(
                  "press flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[11px] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  brush.toLowerCase() === color.toLowerCase() ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                )}
              >
                <span className="h-3.5 w-3.5 shrink-0 rounded-[4px] border border-white/15" style={{ backgroundColor: color, boxShadow: `0 0 8px -2px ${color}` }} />
                <span className="font-mono uppercase text-zinc-400">{color}</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-600">{count} {count === 1 ? "tecla" : "teclas"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DeckPanel>
  );
}
