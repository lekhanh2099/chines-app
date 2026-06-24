import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
 title,
 description,
 action,
 compact,
}: {
 title: string;
 description: string;
 action?: ReactNode;
 compact?: boolean;
}) {
 return (
  <div
   className={cn(
    "nova-glass-panel flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default p-8 text-center",
    compact ? "min-h-80" : "min-h-[32rem] shadow-theme-lg",
   )}
  >
   <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-text">
    <Sparkles className="h-6 w-6" />
   </span>
   <h2 className="mt-4 text-2xl font-black text-text-primary">{title}</h2>
   <p className="mt-2 max-w-md font-medium leading-6 text-text-muted">{description}</p>
   {action ? <div className="mt-5">{action}</div> : null}
  </div>
 );
}
