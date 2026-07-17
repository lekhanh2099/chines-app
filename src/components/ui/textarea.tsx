import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
 font?: "sans" | "mono";
};

function Textarea({ className, font = "sans", ...props }: TextareaProps) {
 return (
  <textarea
   className={cn(
    "min-h-24 w-full resize-y rounded-2xl border border-border-default bg-bg-primary px-4 py-3 leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20",
    font === "mono" && "font-mono",
    className,
   )}
   {...props}
  />
 );
}

export { Textarea };
