import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
 title,
 description,
 actions,
 className,
}: {
 title: string;
 description?: string;
 actions?: ReactNode;
 className?: string;
}) {
 return (
  <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
   <div className="min-w-0 max-w-3xl">
    <h1 className="text-2xl font-black leading-tight tracking-tight text-text-primary sm:text-3xl">
     {title}
    </h1>
    {description ? (
     <p className="mt-2 text-sm font-medium leading-6 text-text-muted sm:text-base">
      {description}
     </p>
    ) : null}
   </div>
   {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
 );
}
