import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
 "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-bold whitespace-nowrap outline-none transition-colors select-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:border-primary/35 data-[state=on]:ring-2 data-[state=on]:ring-ring/15 [&_svg]:pointer-events-none [&_svg]:shrink-0",
 {
  variants: {
   variant: {
    default:
     "border-border-default bg-bg-card text-text-secondary hover:bg-bg-subtle hover:text-text-primary",
    outline:
     "border-border-default bg-transparent text-text-secondary hover:border-primary/25 hover:bg-accent-subtle hover:text-accent-text",
    accent: "border-accent/30 bg-accent-subtle text-accent-text hover:bg-accent-subtle/80",
    success: "border-success/30 bg-success-subtle text-success-text hover:bg-success-subtle/80",
    warning: "border-warning/30 bg-warning-subtle text-warning-text hover:bg-warning-subtle/80",
    danger: "border-danger/30 bg-danger-subtle text-danger-text hover:bg-danger-subtle/80",
    info: "border-info/30 bg-info-subtle text-info-text hover:bg-info-subtle/80",
   },
   size: {
    sm: "min-h-7 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
    md: "min-h-8 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
    lg: "min-h-10 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
    touch: "min-h-11 px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "md",
  },
 },
);

function Chip({
 className,
 variant,
 size,
 pressed,
 asChild = false,
 ...props
}: React.ComponentProps<"button"> &
 VariantProps<typeof chipVariants> & {
  pressed?: boolean;
  asChild?: boolean;
 }) {
 const Comp = asChild ? Slot.Root : "button";

 return (
  <Comp
   data-slot="chip"
   data-state={pressed === undefined ? undefined : pressed ? "on" : "off"}
   aria-pressed={pressed}
   className={cn(chipVariants({ variant, size }), className)}
   {...(!asChild ? { type: "button" } : {})}
   {...props}
  />
 );
}

export { Chip, chipVariants };
