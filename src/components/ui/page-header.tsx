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
    "flex flex-wrap items-start justify-between",
    compact ? "gap-3" : "gap-4",
    className,
   )}
  >
   <div className="min-w-0 max-w-3xl">
    {eyebrow ? (
     <Typography
      as="div"
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
      className={compact ? "mb-1" : "mb-1.5"}
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
    {description ? (
     <Typography
      as="p"
      variant="bodySmall"
      tone="muted"
      weight="medium"
      leading={compact ? "compact" : "standard"}
      className={compact ? "mt-1" : "mt-2"}
     >
      {description}
     </Typography>
    ) : null}
    {meta ? <div className={compact ? "mt-2" : "mt-3"}>{meta}</div> : null}
   </div>
   {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
 );
}
