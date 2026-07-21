import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Presses feel responsive: scale(0.97) on :active. Only transform/opacity/colors
  // transition — never `all`. Custom ease-out gives the motion intent.
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium " +
    "transition-[transform,background-color,color,box-shadow,border-color] duration-200 [transition-timing-function:var(--ease-out)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,.15)_inset,0_8px_24px_-8px_hsl(var(--primary)/.7)] hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-accent-foreground",
        ghost: "hover:bg-white/[0.06] hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));
Button.displayName = "Button";
