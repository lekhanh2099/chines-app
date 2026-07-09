import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspaceCommandHeaderProps = {
 title: ReactNode;
 description?: ReactNode;
 badge?: ReactNode;
 controls?: ReactNode;
 children?: ReactNode;
 className?: string;
};

export function WorkspaceCommandHeader({
 title,
 description,
 badge,
 controls,
 children,
 className,
}: WorkspaceCommandHeaderProps) {
 return (
  <header
   className={cn(
    "sticky top-0 z-20 grid shrink-0 gap-3 border-b border-border-default bg-bg-card/95 px-3 py-3 shadow-theme-sm backdrop-blur sm:px-4 lg:gap-4 lg:px-6 lg:py-4 xl:px-8",
    className,
   )}
  >
   <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
    <div className="grid min-w-0 gap-1">
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <h1 className="min-w-0 truncate text-xl font-bold text-text-primary">{title}</h1>
      {badge}
     </div>
     {description ? (
      <p className="text-sm font-medium text-text-muted">{description}</p>
     ) : null}
    </div>

    {controls ? <div className="flex min-w-0 flex-wrap items-center gap-2">{controls}</div> : null}
   </div>

   {children}
  </header>
 );
}
