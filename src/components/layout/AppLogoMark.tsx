import { Languages } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppLogoMark({ className }: { className?: string }) {
 return (
  <span
   aria-hidden="true"
   className={cn(
    "app-brand-gradient relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 text-white",
    className,
   )}
  >
   <Languages className="size-5.5" strokeWidth={2.4} />
  </span>
 );
}
