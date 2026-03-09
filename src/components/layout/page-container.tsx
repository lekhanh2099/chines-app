import type * as React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = React.ComponentProps<"div">;

/**
 * Fluid page wrapper — width is dynamic (controlled by parent layout).
 * Provides consistent inline padding only. No margin.
 */
function PageContainer({ className, children, ...rest }: PageContainerProps) {
 return (
  <div className={cn("w-full h-full overflow-y-auto", className)} {...rest}>
   <div className="w-full px-4 py-5 sm:px-6">{children}</div>
  </div>
 );
}

export { PageContainer };
