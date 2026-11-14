import * as React from "react";
import { ChevronDown } from "lucide-react";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";

export type NativeSelectProps = React.ComponentProps<"select"> & {
 readonly density?: "compact" | "default";
};

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
 ({ className, density = "compact", children, ...props }, ref) => {
  return (
   <div className="relative inline-flex max-w-full min-w-0 items-center">
    <select
     ref={ref}
     data-slot="native-select"
     className={cn(
      "max-w-full min-w-0 truncate appearance-none rounded-lg border border-border-default/80 bg-surface-muted/50 font-medium text-foreground outline-none transition-colors select-none",
      "hover:bg-surface-muted hover:border-primary/40 focus:border-primary",
      focusRingClassName,
      density === "compact"
       ? "h-7 min-h-7 pl-2 pr-6 text-xs leading-none"
       : "h-9 min-h-9 pl-3 pr-8 text-sm",
      className,
     )}
     {...props}
    >
     {children}
    </select>
    <ChevronDown
     aria-hidden="true"
     className="pointer-events-none absolute right-1.5 size-3.5 text-muted-foreground"
    />
   </div>
  );
 },
);
NativeSelect.displayName = "NativeSelect";
