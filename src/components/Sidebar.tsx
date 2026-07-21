import { Cable, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import type { DeviceStatus, Profile } from "@/lib/types";

interface SidebarProps {
  device: DeviceStatus;
  checking: boolean;
  onRefresh: () => void;
  profiles: Profile[];
  activeProfile: number;
  onSelectProfile: (profile: Profile) => void;
}

export function Sidebar({ device, checking, onRefresh, profiles, activeProfile, onSelectProfile }: SidebarProps) {
  return (
    <aside className="flex flex-col border-r border-white/[0.06] bg-black/30 px-5 py-6 backdrop-blur-xl">
      {/* Brand lockup — the mark is the app's identity. */}
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent shadow-[0_8px_20px_-8px_rgba(0,0,0,.8)]">
          <Logo className="h-4 w-auto text-foreground" />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Neo Genesis</div>
          <div className="text-[11px] text-muted-foreground">Console de iluminação</div>
        </div>
      </div>

      <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-600">Dispositivo</div>
      <div className="mb-8 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 grid h-9 w-9 place-items-center rounded-lg transition-colors", device.connected ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-6px_rgba(16,185,129,.6)]" : "bg-zinc-800 text-zinc-500")}>
            <Cable className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">HyperX Mars</div>
            <div className="mt-1 font-mono text-[10px] text-zinc-500">0951 · 16C6</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <Badge variant={device.connected ? "success" : "warning"}>
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", device.connected ? "bg-emerald-400" : "bg-amber-400", device.connected && "animate-pulse-soft")} />
            {device.connected ? "Conectado" : "Desconectado"}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={checking} title="Verificar conexão">
            <RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-600">Perfis</span>
        <span className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-500">10 locais</span>
      </div>
      <nav className="-mr-2 space-y-1 overflow-y-auto pr-2">
        {profiles.map((profile) => {
          const active = activeProfile === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                "transition-[background-color,color] duration-200 [transition-timing-function:var(--ease-out)] active:scale-[0.99]",
                active ? "bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05)]" : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
              )}
            >
              <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[10px] transition-colors", active ? "border-primary/50 bg-primary/15 text-primary" : "border-white/[0.08] text-zinc-500")}>
                {String(profile.id).padStart(2, "0")}
              </span>
              <span className="flex-1 truncate">{profile.name}</span>
              <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-all", active ? "text-primary opacity-100" : "text-zinc-600 opacity-0 group-hover:opacity-60")} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
