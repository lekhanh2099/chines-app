import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const emptyStateVariants = cva("grid w-full justify-items-center text-center", {
 variants: {
  size: {
   compact: "gap-2 p-4",
   default: "gap-3 p-6",
   spacious: "gap-4 p-10",
  },
  surface: {
   plain: "",
   card: "rounded-2xl border border-border-default bg-bg-card shadow-theme-sm",
   subtle: "rounded-2xl border border-border-default bg-bg-subtle",
   accent: "rounded-2xl border border-accent/25 bg-accent-subtle",
  },
  align: {
   center: "justify-items-center text-center",
   start: "justify-items-start text-left",
  },
 },
 defaultVariants: {
  size: "default",
  surface: "plain",
  align: "center",
 },
});

type EmptyStateProps = React.ComponentProps<"section"> &
 VariantProps<typeof emptyStateVariants> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
 };

function EmptyState({
 className,
 size,
 surface,
 align,
 icon,
 title,
 description,
 actions,
 ...props
}: EmptyStateProps) {
 return (
  <section
   data-slot="empty-state"
   className={cn(emptyStateVariants({ size, surface, align }), className)}
   {...props}
  >
   {icon ? (
    <div
     data-slot="empty-state-icon"
     className="flex size-10 items-center justify-center rounded-xl bg-bg-card text-accent-text shadow-theme-sm [&_svg]:size-5"
    >
     {icon}
    </div>
   ) : null}

   <div className="grid max-w-lg gap-1">
    <Typography as="h3" variant="cardTitle">
     {title}
    </Typography>
    {description ? (
     <Typography variant="bodySmall" tone="muted">
      {description}
     </Typography>
    ) : null}
   </div>

   {actions ? (
    <div
     data-slot="empty-state-actions"
     className="flex flex-wrap items-center justify-center gap-2"
    >
     {actions}
    </div>
   ) : null}
  </section>
 );
}

export { EmptyState, emptyStateVariants };
export type { EmptyStateProps };
