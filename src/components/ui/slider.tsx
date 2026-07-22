import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Render detent dots for stepped ranges (e.g. the firmware's 1..5). */
  ticks?: boolean;
}

export function Slider({ className, ticks, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  const count = ticks ? Math.round((max - min) / step) + 1 : 0;
  return (
    <div className={cn("relative", className)}>
      <SliderPrimitive.Root className="relative flex w-full touch-none select-none items-center py-1" min={min} max={max} step={step} {...props}>
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary shadow-[0_0_10px_-2px_hsl(var(--primary))]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-[0_0_12px_-2px_hsl(var(--primary))] transition-transform duration-150 [transition-timing-function:var(--ease-out)] hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95" />
      </SliderPrimitive.Root>
      {ticks && (
        <div aria-hidden className="pointer-events-none mt-1 flex justify-between px-[7px]">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-white/[0.14]" />
          ))}
        </div>
      )}
    </div>
  );
}
