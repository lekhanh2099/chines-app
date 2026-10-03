import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const floatingLayerVariants = cva("fixed z-120", {
 variants: {
  variant: {
   editorTooltip:
    "whitespace-pre-wrap rounded-xl border border-border-default bg-bg-elevated px-3 py-2 shadow-theme-lg",
   editorControls:
    "pointer-events-auto grid -translate-x-1/2 -translate-y-full gap-1 rounded-xl border border-border-default bg-bg-elevated px-3 py-2 shadow-theme-lg animate-in fade-in zoom-in-95 duration-150",
  },
 },
});

function FloatingLayer({
 className,
 variant,
 ...props
}: React.ComponentProps<"div"> & VariantProps<typeof floatingLayerVariants>) {
 return (
  <div
   data-slot="floating-layer"
   className={cn(floatingLayerVariants({ variant }), className)}
   {...props}
  />
 );
}

export { FloatingLayer, floatingLayerVariants };
