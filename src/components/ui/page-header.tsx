import { Typography } from "@/components/ui/typography";
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
    <Typography
     as="h1"
     variant="pageTitle"
     tone="default"
     weight="black"
     leading="tight"
     tracking="tight"
    >
     {title}
    </Typography>
    {description ? (
     <Typography
      as="p"
      variant="bodySmall"
      tone="muted"
      weight="medium"
      leading="standard"
      className="mt-2"
     >
      {description}
     </Typography>
    ) : null}
   </div>
   {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
 );
}
