import type { ReactNode } from "react";

import { HskSectionNav } from "@/features/hanzihome/hsk/HskSectionNav";

export default function HskLayout({ children }: { children: ReactNode }) {
 return (
  <>
   <div className="hanzihome-static-page min-w-0 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
    <HskSectionNav />
   </div>
   {children}
  </>
 );
}
