import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function HomeSectionHeader({
 id,
 title,
 description,
 action,
 className,
}: {
 id: string;
 title: string;
 description?: string;
 action?: ReactNode;
 className?: string;
}) {
 return (
  <div className={cn("flex flex-wrap items-end justify-between gap-x-3 gap-y-2", className)}>
   <div className="grid min-w-0 flex-[1_1_14rem] gap-1">
    <Typography
     as="h2"
     variant="sectionTitle"
     id={id}
     tone="default"
     weight="black"
     tracking="tight"
    >
     {title}
    </Typography>
    {description ? (
     <Typography
      as="p"
      variant="bodySmall"
      tone="muted"
      weight="semibold"
      leading="compact"
     >
      {description}
     </Typography>
    ) : null}
   </div>
   {action ? <div className="shrink-0">{action}</div> : null}
  </div>
 );
}

export function HomeArrowIcon({ className }: { className?: string }) {
 return <ArrowRight className={cn("size-4 shrink-0 text-text-muted", className)} />;
}
