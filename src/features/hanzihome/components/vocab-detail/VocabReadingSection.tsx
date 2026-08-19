import type { ReactNode } from "react";

export function VocabReadingSection({
 id,
 title,
 children,
}: {
 id: string;
 title: string;
 children: ReactNode;
}) {
 return (
  <details
   id={id}
   open
   className="group grid gap-3 rounded-xl border border-border-default bg-bg-card p-4 shadow-theme-sm"
  >
   <summary className="cursor-pointer text-base font-black text-text-primary marker:text-accent-text">
    {title}
   </summary>
   <div className="grid gap-3 text-base leading-relaxed text-text-secondary">{children}</div>
  </details>
 );
}
