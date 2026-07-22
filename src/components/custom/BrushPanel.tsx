import { Paintbrush } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PRESETS = ["#ff164d", "#ff7a00", "#ffd60a", "#34d399", "#22d3ee", "#6366f1", "#d946ef", "#ffffff"];

interface BrushPanelProps {
  brush: string;
  onBrush: (color: string) => void;
  /** Colors currently on the board — surfaced as a quick-pick row. */
  usedColors: string[];
}

export function BrushPanel({ brush, onBrush, usedColors }: BrushPanelProps) {
  return (
    <Card className="border-white/[0.07] bg-white/[0.02]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm"><Paintbrush className="h-4 w-4 text-primary" />Pincel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <label
            className="press relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/15 transition-[box-shadow] duration-200"
            style={{ backgroundColor: brush, boxShadow: `0 0 18px -4px ${brush}` }}
            title="Cor do pincel"
          >
            <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={brush} onChange={(event) => onBrush(event.target.value)} />
          </label>
          <div>
            <div className="text-xs text-zinc-400">Cor atual</div>
            <div className="font-mono text-sm uppercase tracking-wide">{brush}</div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Predefinições</div>
          <div className="grid grid-cols-8 gap-1.5">
            {PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => onBrush(color)}
                title={color}
                className={cn("press h-6 w-full rounded-md border", brush.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-white/30" : "border-white/15 hover:border-white/40")}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {usedColors.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">No teclado</div>
            <div className="flex flex-wrap gap-1.5">
              {usedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onBrush(color)}
                  title={color}
                  className={cn("press h-6 w-6 rounded-md border", brush.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-white/30" : "border-white/15 hover:border-white/40")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
