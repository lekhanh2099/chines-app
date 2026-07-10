import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RadicalSection({
 title,
 children,
 className,
}: {
 title: string;
 children: ReactNode;
 className?: string;
}) {
 return (
  <section
   className={cn(
    "grid content-start gap-2 rounded-xl bg-bg-subtle p-4 text-base leading-relaxed text-text-secondary",
    className,
   )}
  >
   <h4 className="text-base font-black text-text-primary">{title}</h4>
   {children}
  </section>
 );
}
