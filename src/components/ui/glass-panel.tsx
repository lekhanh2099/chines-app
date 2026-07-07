import type * as React from "react";

import { cn } from "@/lib/utils";

export function GlassPanel({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="glass-panel"
   className={cn("app-glass-surface rounded-2xl border", className)}
   {...props}
  />
 );
}
