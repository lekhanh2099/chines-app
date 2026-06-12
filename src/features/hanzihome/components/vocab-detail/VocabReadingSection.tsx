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
  <details id={id} open className="group rounded-xl border border-border-default bg-bg-subtle p-4">
   <summary className="cursor-pointer text-base font-black text-text-primary">{title}</summary>
   <div className="grid gap-3 text-base leading-relaxed text-text-secondary">{children}</div>
  </details>
 );
}
