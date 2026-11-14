import type { ReactNode } from "react";

export function WorkspaceToolbar({ children }: { children: ReactNode }) {
 return (
  <div className="hanzihome-liquid-toolbar relative z-30 flex min-w-0 shrink-0 items-center justify-between gap-2 overflow-hidden rounded-xl p-1">
   {children}
  </div>
 );
}
