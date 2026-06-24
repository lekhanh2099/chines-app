import type * as React from "react";

import { cn } from "@/lib/utils";

export function GlassPanel({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="glass-panel"
   className={cn("nova-glass-panel rounded-2xl border", className)}
   {...props}
  />
 );
}
