import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea">;

function Textarea({ className, ...props }: TextareaProps) {
 return (
  <textarea
   className={cn(
    "min-h-24 w-full resize-y rounded-2xl border border-border-default bg-bg-primary px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-ring",
    className,
   )}
   {...props}
  />
 );
}

export { Textarea };
