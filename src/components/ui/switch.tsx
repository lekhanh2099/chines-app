"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const switchVariants = cva(
 "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-border-default bg-bg-subtle outline-none transition-colors focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent",
 {
  variants: {
   size: {
    sm: "h-5 w-9",
    md: "h-6 w-11",
    lg: "h-7 w-12",
   },
   tone: {
    accent: "data-[state=checked]:bg-primary",
    success: "data-[state=checked]:bg-success",
    warning: "data-[state=checked]:bg-warning",
    danger: "data-[state=checked]:bg-danger",
   },
  },
  defaultVariants: {
   size: "md",
   tone: "accent",
  },
 },
);

const switchThumbVariants = cva(
 "pointer-events-none block translate-x-0.5 rounded-full bg-primary-foreground shadow-theme-sm transition-transform",
 {
  variants: {
   size: {
    sm: "size-4 data-[state=checked]:translate-x-[1.125rem]",
    md: "size-5 data-[state=checked]:translate-x-[1.375rem]",
    lg: "size-6 data-[state=checked]:translate-x-[1.375rem]",
   },
  },
  defaultVariants: {
   size: "md",
  },
 },
);

function Switch({
 className,
 size,
 tone,
 ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & VariantProps<typeof switchVariants>) {
 return (
  <SwitchPrimitive.Root
   data-slot="switch"
   className={cn(switchVariants({ size, tone }), className)}
   {...props}
  >
   <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
  </SwitchPrimitive.Root>
 );
}

export { Switch, switchThumbVariants, switchVariants };
