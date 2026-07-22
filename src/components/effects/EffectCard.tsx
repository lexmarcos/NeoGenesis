import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { EffectThumb } from "@/components/effects/EffectThumb";
import { cn } from "@/lib/utils";
import type { Effect } from "@/lib/types";

interface EffectCardProps {
  effect: Effect;
  label: string;
  description: string;
  colors: string[];
  active: boolean;
  /** True when the live config differs from the saved profile. */
  modified: boolean;
  staggerIndex: number;
  onSelect: (effect: Effect) => void;
}

export function EffectCard({ effect, label, description, colors, active, modified, staggerIndex, onSelect }: EffectCardProps) {
  return (
    <button
      onClick={() => onSelect(effect)}
      style={{ animationDelay: `${staggerIndex * 50}ms` } as CSSProperties}
      className={cn(
        "press group relative animate-fade-in-up overflow-hidden rounded-xl border p-2.5 text-left",
        "transition-[border-color,background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)]",
        active
          ? "border-primary/50 bg-primary/[0.07] shadow-[0_0_30px_-10px_hsl(var(--primary)/.7)]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
      )}
    >
      <EffectThumb effect={effect} colors={colors} className="h-16" />
      <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5 pb-0.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium leading-tight">{label}</div>
          <div className="mt-0.5 truncate text-[10px] text-zinc-500">{description}</div>
        </div>
        {active && (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_12px_-2px_hsl(var(--primary))]">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
      {modified && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)]" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-300">editado</span>
        </span>
      )}
    </button>
  );
}
