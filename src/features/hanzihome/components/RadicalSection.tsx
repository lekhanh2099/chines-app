import type { ReactNode } from "react";

export function RadicalSection({ title, children }: { title: string; children: ReactNode }) {
 return (
  <section className="grid gap-2 rounded-xl bg-bg-subtle p-4 text-base leading-relaxed text-text-secondary">
   <h4 className="text-base font-black text-text-primary">{title}</h4>
   {children}
  </section>
 );
}
