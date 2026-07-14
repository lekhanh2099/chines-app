import type { ReactNode } from "react";

export function ExercisePill({ children }: { children: ReactNode }) {
 return (
  <span className="study-content-surface rounded-lg border px-3 py-2 font-bold">{children}</span>
 );
}
