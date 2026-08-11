"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tooltipContentVariants = cva(
 "z-130 max-w-xs rounded-lg text-balance shadow-theme-sm outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
 {
  variants: {
   variant: {
    default: "bg-bg-inverse text-text-inverse",
    surface: "border border-border-default bg-bg-elevated text-text-primary",
    accent: "bg-primary text-primary-foreground",
   },
   size: {
    sm: "px-2 py-1 text-xs font-semibold",
    md: "px-2.5 py-1.5 text-sm font-semibold",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "sm",
  },
 },
);

function TooltipProvider({
 delayDuration = 350,
 skipDelayDuration = 250,
 ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
 return (
  <TooltipPrimitive.Provider
   delayDuration={delayDuration}
   skipDelayDuration={skipDelayDuration}
   {...props}
  />
 );
}

const Tooltip = TooltipPrimitive.Root;

function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
 return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
 className,
 sideOffset = 8,
 variant,
 size,
 ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> &
 VariantProps<typeof tooltipContentVariants>) {
 return (
  <TooltipPrimitive.Portal>
   <TooltipPrimitive.Content
    data-slot="tooltip-content"
    sideOffset={sideOffset}
    className={cn(tooltipContentVariants({ variant, size }), className)}
    {...props}
   />
  </TooltipPrimitive.Portal>
 );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, tooltipContentVariants };
