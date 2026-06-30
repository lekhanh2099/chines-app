import type { ReactNode } from "react";

export function AnswerReveal({
 defaultOpen = false,
 label = "Xem đáp án",
 children,
}: {
 defaultOpen?: boolean;
 label?: string;
 children: ReactNode;
}) {
 return (
  <details
   open={defaultOpen || undefined}
   className="group"
  >
   <summary className="exercise-answer-trigger cursor-pointer list-none rounded-md px-2 py-1 text-xs font-black uppercase tracking-wide marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    {label}
   </summary>
   <div className="exercise-answer-surface mt-1 grid gap-2 rounded-md border px-3 py-2">
    {children}
   </div>
  </details>
 );
}
