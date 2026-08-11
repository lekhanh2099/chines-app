import type { ReactNode } from "react";

import { focusRingClassName } from "@/components/ui/focus-ring";

export function AnswerReveal({
 defaultOpen = false,
 open,
 onOpenChange,
 label = "Xem đáp án",
 children,
}: {
 defaultOpen?: boolean;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
 label?: string;
 children: ReactNode;
}) {
 const isControlled = typeof open === "boolean";

 return (
  <details
   open={(isControlled ? open : defaultOpen) || undefined}
   onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
   className="group grid gap-1"
  >
   <summary
    className={`exercise-answer-trigger cursor-pointer list-none rounded-md px-2 py-1 text-xs font-black uppercase tracking-wide marker:hidden ${focusRingClassName}`}
   >
    {label}
   </summary>
   <div className="exercise-answer-surface grid gap-2 rounded-md border px-3 py-2">{children}</div>
  </details>
 );
}
