import type * as React from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
 title: string;
 description?: string;
 trailing?: React.ReactNode;
 className?: string;
};

/**
 * Standardized section header with uppercase label + optional description.
 * Replaces the repeated pattern:
 *   <p className="text-[10px] font-bold uppercase tracking-[0.18em]...">Title</p>
 *   <p className="mt-1 text-sm text-text-muted">Description</p>
 */
function SectionHeader({
 title,
 description,
 trailing,
 className,
}: SectionHeaderProps) {
 return (
  <div
   className={cn("flex flex-wrap items-start justify-between gap-3", className)}
  >
   <div>
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
     {title}
    </p>
    {description && (
     <p className="mt-1 text-sm text-text-muted">{description}</p>
    )}
   </div>
   {trailing}
  </div>
 );
}

export { SectionHeader };
