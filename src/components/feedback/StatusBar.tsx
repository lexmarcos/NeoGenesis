import { useState } from "react";
import { Cable, CheckCircle2, ChevronUp, CircleAlert, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEventTime, type LogEntry } from "@/hooks/useEventLog";
import { cn } from "@/lib/utils";
import type { DeviceStatus } from "@/lib/types";

/**
 * The console readout at the foot of the app: what hardware we're talking to
 * on the left, the latest event on the right, and a chevron that expands the
 * timestamped history. Connection state lives here and nowhere else.
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

const hexId = (value: number) => value.toString(16).padStart(4, "0").toUpperCase();

interface StatusBarProps {
  entries: LogEntry[];
  device: DeviceStatus;
  checking: boolean;
  onRefresh: () => void;
}

export function StatusBar({ entries, device, checking, onRefresh }: StatusBarProps) {
  const [open, setOpen] = useState(false);
  const latest = entries[0];
  const LatestIcon = KIND_ICON[latest.kind];

  return (
    <footer className="relative flex h-12 shrink-0 items-center gap-3 border-t border-white/[0.06] bg-black/30 px-4 backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg transition-colors duration-200",
            device.connected ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_18px_-6px_rgba(16,185,129,.7)]" : "bg-white/[0.04] text-zinc-500"
          )}
        >
          <Cable className="h-3.5 w-3.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-[12px] font-medium">{device.name}</span>
          <span className="block font-mono text-[9px] text-zinc-600">{hexId(device.vendorId)} · {hexId(device.productId)}</span>
        </span>
        <Badge variant={device.connected ? "success" : "warning"} className="ml-1 py-0.5 text-[10px]">
          <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", device.connected ? "bg-emerald-400 animate-pulse-soft" : "bg-amber-400")} />
          {device.connected ? "Conectado" : "Desconectado"}
        </Badge>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={checking} title="Verificar conexão">
          <RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
        </Button>
      </div>

      <span aria-hidden className="h-6 w-px shrink-0 bg-white/[0.08]" />

      <button
        onClick={() => setOpen((value) => !value)}
        className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        title={open ? "Recolher histórico" : "Ver histórico de eventos"}
      >
        <LatestIcon className={cn("h-3.5 w-3.5 shrink-0", KIND_COLOR[latest.kind])} />
        <span key={latest.id} className="min-w-0 flex-1 truncate text-xs text-zinc-300 animate-fade-in">{latest.message}</span>
        <ChevronUp className={cn("h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover:text-zinc-400", !open && "rotate-180")} />
      </button>

      {/* Event history */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 max-h-64 overflow-y-auto border-t border-white/[0.08] bg-[#0a0a0f]/95 shadow-[0_-16px_40px_-16px_rgba(0,0,0,.8)] backdrop-blur-xl animate-fade-in-up [animation-duration:.25s]">
          <div className="px-4 py-3">
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
