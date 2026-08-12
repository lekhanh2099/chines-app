import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const iconTileVariants = cva(
 "inline-flex shrink-0 items-center justify-center rounded-lg [&_svg]:shrink-0",
 {
  variants: {
   tone: {
    accent: "border border-primary/15 bg-accent-subtle text-accent-text",
    neutral: "border border-border-default bg-bg-subtle text-text-secondary",
    info: "border border-info/20 bg-info-subtle text-info-text",
    warning: "border border-warning/25 bg-warning-subtle text-warning-text",
    inverse: "app-brand-gradient border border-transparent text-text-inverse shadow-theme-sm",
   },
   size: {
    sm: "size-8 [&_svg]:size-4",
    md: "size-10 [&_svg]:size-5",
    lg: "size-11 [&_svg]:size-5",
   },
  },
  defaultVariants: {
   tone: "accent",
   size: "md",
  },
 },
);

type IconTileProps = React.ComponentProps<"span"> & VariantProps<typeof iconTileVariants>;

function IconTile({ className, tone, size, ...props }: IconTileProps) {
 return (
  <span
   aria-hidden="true"
   data-slot="icon-tile"
   className={cn(iconTileVariants({ tone, size }), className)}
   {...props}
  />
 );
}

export { IconTile, iconTileVariants };
export type { IconTileProps };
