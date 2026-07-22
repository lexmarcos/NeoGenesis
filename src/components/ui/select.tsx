import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The console's dropdown. Triggers stay flush with the surrounding chrome
 * (hairline border, no fill) and only light up — primary border, faint
 * primary wash — while the menu is open, so an open list reads as the one
 * live control on screen.
 */

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectItemText = SelectPrimitive.ItemText;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 text-left",
      "transition-[border-color,background-color,box-shadow] duration-200 [transition-timing-function:var(--ease-out)]",
      "hover:border-white/[0.18] hover:bg-white/[0.05]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
      "data-[state=open]:border-primary/45 data-[state=open]:bg-primary/[0.06] data-[state=open]:shadow-[0_0_24px_-10px_hsl(var(--primary))]",
      "disabled:pointer-events-none disabled:opacity-45",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export function SelectContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className={cn(
          "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-white/[0.09]",
          "bg-[#0b0b11]/95 p-1 shadow-[0_28px_70px_-24px_rgba(0,0,0,.95)] backdrop-blur-xl",
          "data-[state=open]:animate-fade-in-up [animation-duration:.18s]",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="max-h-[min(22rem,var(--radix-select-content-available-height))]">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 outline-none",
      "transition-colors duration-150 [transition-timing-function:var(--ease-out)]",
      "data-[highlighted]:bg-white/[0.06] data-[highlighted]:text-zinc-100",
      "data-[state=checked]:bg-primary/[0.09] data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    {children}
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

/** The magenta tick that marks the selected row. */
export function SelectCheck({ className }: { className?: string }) {
  return (
    <SelectPrimitive.ItemIndicator asChild>
      <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_10px_-2px_hsl(var(--primary))]", className)}>
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    </SelectPrimitive.ItemIndicator>
  );
}
