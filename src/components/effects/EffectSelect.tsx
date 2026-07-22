import { Select, SelectCheck, SelectContent, SelectItem, SelectItemText, SelectTrigger } from "@/components/ui/select";
import { EFFECTS } from "@/components/effects/effects";
import { cn } from "@/lib/utils";
import type { Effect } from "@/lib/types";

/**
 * The effect picker. Each row carries the effect's own glyph, tinted with the
 * brand magenta once it's the one running on the board.
 */

interface EffectSelectProps {
  value: Effect;
  /** Effects whose live config differs from the saved profile. */
  dirty: Set<Effect>;
  onChange: (effect: Effect) => void;
}

function Glyph({ icon: Icon, active }: { icon: (typeof EFFECTS)[number]["icon"]; active: boolean }) {
  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors duration-200 [transition-timing-function:var(--ease-out)]",
        active
          ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_16px_-6px_hsl(var(--primary))]"
          : "border-white/[0.08] bg-white/[0.03] text-zinc-400"
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function EffectSelect({ value, dirty, onChange }: EffectSelectProps) {
  const current = EFFECTS.find((effect) => effect.id === value) ?? EFFECTS[0];

  return (
    <Select value={value} onValueChange={(next) => onChange(next as Effect)}>
      <SelectTrigger className="h-12 w-full px-2.5" aria-label="Efeito de iluminação">
        <Glyph icon={current.icon} active />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium leading-tight text-zinc-100">{current.label}</span>
          <span className="block truncate text-[10px] leading-tight text-zinc-500">{current.description}</span>
        </span>
      </SelectTrigger>

      <SelectContent>
        {EFFECTS.map((effect) => (
          <SelectItem key={effect.id} value={effect.id}>
            <Glyph icon={effect.icon} active={effect.id === value} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium leading-tight">
                <SelectItemText>{effect.label}</SelectItemText>
              </span>
              <span className="block truncate text-[10px] leading-tight text-zinc-500">{effect.description}</span>
            </span>
            {dirty.has(effect.id) && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)]"
                title="Alterações não salvas neste efeito"
              />
            )}
            <SelectCheck />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
