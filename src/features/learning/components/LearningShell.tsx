import type { ReactNode } from "react";

export function LearningShell({
 children,
 maxWidth = "max-w-none",
}: {
 children: ReactNode;
 maxWidth?: string;
}) {
 return (
  <div className="page-shell min-h-screen bg-stone-50">
   <div
    className={`mx-auto flex w-full max-w-full min-w-0 ${maxWidth} flex-col gap-4 overflow-x-hidden scrollbar-soft  px-4 py-4 sm:px-5 lg:px-8`}
   >
    {children}
   </div>
  </div>
 );
}
