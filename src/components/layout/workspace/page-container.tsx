import type * as React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = React.ComponentProps<"div">;

/**
 * Fluid page wrapper — full width, no max-width, no nested page scroll.
 * Scroll is owned by the app main shell.
 */
function PageContainer({ className, children, ...rest }: PageContainerProps) {
 return (
  <div data-page className={cn("w-full min-w-0", className)} {...rest}>
   <div className="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8">{children}</div>
  </div>
 );
}

export { PageContainer };
