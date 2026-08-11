import { Typography } from "@/components/ui/typography";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderDensity = "default" | "compact";

export function PageHeader({
 title,
 description,
 actions,
 eyebrow,
 meta,
 density = "default",
 className,
}: {
 title: string;
 description?: string;
 actions?: ReactNode;
 eyebrow?: ReactNode;
 meta?: ReactNode;
 density?: PageHeaderDensity;
 className?: string;
}) {
 const compact = density === "compact";

 return (
  <header
   className={cn(
    "flex min-w-0 flex-wrap items-start justify-between",
    compact ? "gap-3" : "gap-4",
    className,
   )}
  >
   <div
    className={cn(
     "grid min-w-0 max-w-3xl flex-[1_1_18rem]",
     compact ? "gap-2" : "gap-3",
    )}
   >
    <div className={cn("grid", compact ? "gap-1" : "gap-1.5")}>
     {eyebrow ? (
      <Typography
       as="div"
       variant="overline"
       tone="muted"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       {eyebrow}
      </Typography>
     ) : null}
     <Typography
      as="h1"
      variant={compact ? "sectionTitle" : "pageTitle"}
      tone="default"
      weight="black"
      leading="tight"
      tracking="tight"
     >
      {title}
     </Typography>
    </div>
    {description ? (
     <Typography
      as="p"
      variant="bodySmall"
      tone="muted"
      weight="medium"
      leading={compact ? "compact" : "standard"}
     >
      {description}
     </Typography>
    ) : null}
    {meta ? <div>{meta}</div> : null}
   </div>
   {actions ? (
    <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-[0_1_auto] sm:justify-end">
     {actions}
    </div>
   ) : null}
  </header>
 );
}
