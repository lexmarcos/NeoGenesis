import { useState } from "react";
import { CheckCircle2, ChevronUp, CircleAlert, Info } from "lucide-react";
import { formatEventTime, type LogEntry } from "@/hooks/useEventLog";
import { cn } from "@/lib/utils";

/**
 * The console readout at the foot of the console: just the latest event and
 * a chevron that expands the timestamped history. Nothing else — sync state
 * lives in the header and in the Alterações rail.
 */

const KIND_ICON = {
  info: Info,
  success: CheckCircle2,
  error: CircleAlert
};

const KIND_COLOR = {
  info: "text-zinc-400",
  success: "text-emerald-400",
  error: "text-red-400"
};

interface StatusBarProps {
  entries: LogEntry[];
  connected: boolean;
}

export function StatusBar({ entries, connected }: StatusBarProps) {
  const [open, setOpen] = useState(false);
  const latest = entries[0];
  const LatestIcon = KIND_ICON[latest.kind];

  return (
    <footer className="relative flex h-11 shrink-0 items-center border-t border-white/[0.06] bg-black/30 px-5 backdrop-blur-xl">
      <button
        onClick={() => setOpen((value) => !value)}
        className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
        title={open ? "Recolher histórico" : "Ver histórico de eventos"}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={cn("absolute h-full w-full rounded-full", connected ? "bg-emerald-400" : "bg-amber-400", "animate-pulse-soft")} />
        </span>
        <LatestIcon className={cn("h-3.5 w-3.5 shrink-0", KIND_COLOR[latest.kind])} />
        <span key={latest.id} className="min-w-0 flex-1 truncate text-xs text-zinc-300 animate-fade-in">{latest.message}</span>
        <ChevronUp className={cn("h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover:text-zinc-400", !open && "rotate-180")} />
      </button>

      {/* Event history */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 max-h-64 overflow-y-auto border-t border-white/[0.08] bg-[#0a0a0f]/95 shadow-[0_-16px_40px_-16px_rgba(0,0,0,.8)] backdrop-blur-xl animate-fade-in-up [animation-duration:.25s]">
          <div className="px-5 py-3">
            <div className="mb-2 font-display text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-600">Histórico de eventos</div>
            <ul className="space-y-1.5">
              {entries.map((entry) => {
                const Icon = KIND_ICON[entry.kind];
                return (
                  <li key={entry.id} className="flex items-center gap-2.5 text-xs">
                    <Icon className={cn("h-3 w-3 shrink-0", KIND_COLOR[entry.kind])} />
                    <span className="min-w-0 flex-1 truncate text-zinc-400">{entry.message}</span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-600">{formatEventTime(entry.time)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </footer>
  );
}
