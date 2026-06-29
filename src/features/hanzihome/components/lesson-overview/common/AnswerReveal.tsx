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
   className="group rounded-lg border border-accent/25 bg-bg-primary/80"
  >
   <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase tracking-wide text-accent-text marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    {label}
   </summary>
   <div className="grid gap-2 border-t border-accent/20 bg-accent-subtle/45 px-3 py-3">
    {children}
   </div>
  </details>
 );
}
