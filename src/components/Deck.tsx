import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The control deck that sits under the board: one surface, split by hairlines
 * into labelled bays. A single border around the whole thing (instead of a
 * card per group) keeps the controls reading as one instrument.
 */

export function Deck({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] divide-x divide-white/[0.06]", className)}>
      {children}
    </div>
  );
}

interface DeckPanelProps {
  title: string;
  /** Right-aligned readout in the bay's header row. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DeckPanel({ title, aside, children, className }: DeckPanelProps) {
  return (
    <section className={cn("flex min-w-0 flex-col p-4", className)}>
      <div className="mb-3 flex h-5 shrink-0 items-center justify-between gap-2">
        <h3 className="font-display text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-500">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
