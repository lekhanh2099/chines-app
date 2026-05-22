import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
 wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
 ({ className, wrapperClassName, children, ...props }, ref) => {
  return (
   <div className={cn("relative min-w-0 max-w-full", wrapperClassName)}>
    <select
     ref={ref}
     className={cn(
      "h-12 w-full min-w-0 max-w-full appearance-none truncate rounded-2xl border-2 border-stone-200 bg-white px-4 pr-12 text-sm font-black text-stone-900 shadow-theme-sm outline-none transition focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60",
      className,
     )}
     {...props}
    >
     {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
   </div>
  );
 },
);
Select.displayName = "Select";

export { Select };
