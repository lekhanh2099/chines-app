import { Languages } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppLogoMark({ className }: { className?: string }) {
 return (
  <span
   aria-hidden="true"
   className={cn(
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-[linear-gradient(135deg,rgb(20_184_166),rgb(117_72_246))] text-white shadow-[0_10px_24px_rgb(79_70_229_/_20%)]",
    className,
   )}
  >
   <Languages className="h-5.5 w-5.5" strokeWidth={2.4} />
  </span>
 );
}
