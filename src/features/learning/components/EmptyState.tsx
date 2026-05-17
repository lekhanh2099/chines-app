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
    "flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-stone-200 bg-white p-8 text-center",
    compact ? "min-h-80" : "min-h-[520px] shadow-theme-md",
   )}
  >
   <Sparkles className="h-12 w-12 text-stone-300" />
   <h2 className="mt-4 text-2xl font-black text-stone-900">{title}</h2>
   <p className="mt-2 max-w-md text-sm font-bold leading-6 text-stone-500">{description}</p>
   {action ? <div className="mt-5">{action}</div> : null}
  </div>
 );
}
