import { Typography } from "@/components/ui/typography";
import type * as React from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
 title: string;
 description?: string;
 trailing?: React.ReactNode;
 className?: string;
};

/** Standardized section header with optional description and trailing action. */
function SectionHeader({ title, description, trailing, className }: SectionHeaderProps) {
 return (
  <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
   <div className="grid min-w-0 gap-1">
    <Typography
     as="p"
     variant="overline"
     tone="muted"
     weight="bold"
     scale="micro"
     tracking="extraLoose"
     transform="uppercase"
    >
     {title}
    </Typography>
    {description ? (
     <Typography as="p" tone="muted">
      {description}
     </Typography>
    ) : null}
   </div>
   {trailing}
  </div>
 );
}

export { SectionHeader };
