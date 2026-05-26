"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function TooltipProvider({
 delayDuration = 200,
 ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
 return (
  <TooltipPrimitive.Provider
   data-slot="tooltip-provider"
   delayDuration={delayDuration}
   {...props}
  />
 );
}

function Tooltip({
 ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
 return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
 ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
 return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
 className,
 sideOffset = 6,
 children,
 ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
 return (
  <TooltipPrimitive.Portal>
   <TooltipPrimitive.Content
    data-slot="tooltip-content"
    sideOffset={sideOffset}
    className={cn(
     "z-50 max-w-xs rounded-lg border border-border-default bg-popover px-2.5 py-1.5 text-xs font-bold text-popover-foreground shadow-theme-sm",
     "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
     className,
    )}
    {...props}
   >
    {children}
    <TooltipPrimitive.Arrow className="fill-popover" />
   </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
 );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
