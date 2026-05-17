import type { ReactNode } from "react";

export function LearningShell({ children, maxWidth = "max-w-[1500px]" }: { children: ReactNode; maxWidth?: string }) {
 return (
  <div className="min-h-screen bg-stone-50">
   <div className={`mx-auto flex w-full ${maxWidth} flex-col gap-4 px-4 py-4 sm:px-5 lg:px-8`}>
    {children}
   </div>
  </div>
 );
}
