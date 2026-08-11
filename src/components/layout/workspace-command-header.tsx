import { Typography } from "@/components/ui/typography";
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
    "sticky top-0 z-20 grid min-w-0 shrink-0 gap-3 border-b border-border-default bg-bg-card px-3 py-3 sm:px-4 lg:gap-4 lg:px-6 lg:py-4 xl:px-8",
    className,
   )}
  >
   <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-start md:justify-between">
    <div className="grid min-w-0 gap-1">
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Typography
       as="h1"
       variant="pageTitle"
       tone="default"
       weight="bold"
       clamp="one"
       className="min-w-0"
      >
       {title}
      </Typography>
      {badge}
     </div>
     {description ? (
      <div className="text-sm font-medium text-text-muted md:hidden 2xl:block">{description}</div>
     ) : null}
    </div>

    {controls ? (
     <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2">
      {controls}
     </div>
    ) : null}
   </div>

   {children}
  </header>
 );
}
