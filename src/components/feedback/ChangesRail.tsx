import { ArrowRight, CheckCircle2, History, Undo2 } from "lucide-react";
import { EFFECT_LABELS } from "@/components/effects/effects";
import { FIELD_LABELS, formatChangeValue, groupByEffect, type ChangeEntry } from "@/lib/changes";
import { cn } from "@/lib/utils";
import type { Effect } from "@/lib/types";

/**
 * The pending-changes rail: a live diff between the saved profile and the
 * live editing state. Every tweak lands here as an understandable
 * "before → after" line, grouped by effect, with per-effect revert.
 */

interface ChangesRailProps {
  entries: ChangeEntry[];
  onRevertEffect: (effect: Effect) => void;
  onRevertAll: () => void;
}

function ChangeValue({ entry }: { entry: ChangeEntry }) {
  if (entry.field === "active") {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
        <span>{EFFECT_LABELS[entry.from as Effect]}</span>
        <ArrowRight className="h-3 w-3 text-zinc-600" />
        <span className="text-zinc-300">{EFFECT_LABELS[entry.to as Effect]}</span>
      </span>
    );
  }
  if (entry.field === "colors") {
    const from = String(entry.from);
    const to = String(entry.to);
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
        <span className="h-3.5 w-3.5 rounded-[4px] border border-white/15" style={{ backgroundColor: from || "transparent" }} title={from} />
        <ArrowRight className="h-3 w-3 text-zinc-600" />
        <span className="h-3.5 w-3.5 rounded-[4px] border border-white/15" style={{ backgroundColor: to || "transparent", boxShadow: `0 0 8px -2px ${to}` }} title={to} />
        <span className="uppercase text-zinc-400">{to.slice(1)}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
      <span>{formatChangeValue(entry.field, entry.from)}</span>
      <ArrowRight className="h-3 w-3 text-zinc-600" />
      <span className="text-zinc-300">{formatChangeValue(entry.field, entry.to)}</span>
    </span>
  );
}

export function ChangesRail({ entries, onRevertEffect, onRevertAll }: ChangesRailProps) {
  const groups = groupByEffect(entries);

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-sm font-semibold">Alterações</h3>
          {entries.length > 0 && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-px font-mono text-[10px] font-semibold text-amber-300">
              {entries.length}
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <button
            onClick={onRevertAll}
            className="press flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <Undo2 className="h-3 w-3" />
            Reverter tudo
          </button>
        )}
      </header>

      {entries.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-medium text-zinc-300">Perfil sincronizado</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-zinc-600">Tudo o que você ajustar aparece aqui, antes de salvar ou aplicar.</div>
          </div>
        </div>
      ) : (
        <ul className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
          {groups.map(([effect, items]) => (
            <li key={effect}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{EFFECT_LABELS[effect]}</span>
                <button
                  onClick={() => onRevertEffect(effect)}
                  className="press rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
                  title={`Reverter ${EFFECT_LABELS[effect]}`}
                >
                  <Undo2 className="h-3 w-3" />
                </button>
              </div>
              <ul className="space-y-1">
                {items.map((entry, index) => (
                  <li
                    key={`${entry.field}-${entry.colorIndex ?? index}`}
                    className={cn("flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1.5", index === 0 && "animate-fade-in")}
                  >
                    <span className="text-[11px] text-zinc-400">
                      {entry.field === "colors" ? `Cor ${(entry.colorIndex ?? 0) + 1}` : FIELD_LABELS[entry.field]}
                    </span>
                    <ChangeValue entry={entry} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
