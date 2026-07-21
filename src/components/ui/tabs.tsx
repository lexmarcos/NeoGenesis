import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-white/[0.06] bg-black/30 p-1 backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground",
        "transition-[color,background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
        "hover:text-foreground/90",
        "data-[state=active]:bg-white/[0.06] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_1px_0_rgba(255,255,255,.06)]",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "focus-visible:outline-none data-[state=active]:animate-fade-in-up",
        className
      )}
      {...props}
    />
  );
}
