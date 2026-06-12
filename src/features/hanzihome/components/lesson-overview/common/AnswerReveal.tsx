import type { ReactNode } from "react";

export function AnswerReveal({
 label = "Xem đáp án",
 children,
}: {
 label?: string;
 children: ReactNode;
}) {
 return (
  <details className="rounded-lg border border-accent/25 bg-bg-primary">
   <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase tracking-wide text-accent-text marker:hidden">
    {label}
   </summary>
   <div className="grid gap-2 border-t border-accent/20 bg-accent-subtle/55 px-3 py-2">
    {children}
   </div>
  </details>
 );
}
