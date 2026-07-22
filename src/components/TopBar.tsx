import type { ReactNode } from "react";
import { Grid3x3, Waves } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";

/**
 * The single command strip: identity, the two workspaces, and whatever
 * actions the open workspace owns. Everything the app can do starts here,
 * so the buttons never move between tabs.
 *
 * Must be rendered inside a <Tabs> root — it owns the tab list.
 */
export function TopBar({ children }: { children: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-black/30 px-4 backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[11px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent shadow-[0_8px_20px_-8px_rgba(0,0,0,.8)]">
          <Logo className="h-3.5 w-auto text-foreground" />
        </span>
        <span className="font-display text-[13px] font-semibold leading-none tracking-tight">Neo Genesis</span>
      </div>

      <span aria-hidden className="h-6 w-px shrink-0 bg-white/[0.08]" />

      <TabsList>
        <TabsTrigger value="animacao"><Waves className="h-4 w-4" />Animação</TabsTrigger>
        <TabsTrigger value="porTecla"><Grid3x3 className="h-4 w-4" />Por tecla</TabsTrigger>
      </TabsList>

      <div className="ml-auto flex min-w-0 items-center gap-2.5">{children}</div>
    </header>
  );
}
