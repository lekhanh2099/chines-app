import type { ReactNode } from "react";

export function ExercisePill({ children }: { children: ReactNode }) {
 return (
  <span className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2  font-bold text-text-primary">
   {children}
  </span>
 );
}
