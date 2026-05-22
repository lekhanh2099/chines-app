import type * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
 "inline-flex items-center rounded-full font-bold uppercase tracking-[0.18em]",
 {
  variants: {
   variant: {
    default: "border border-border-default bg-bg-primary text-text-secondary",
    accent: "bg-accent-subtle text-accent-text",
    warning: "border border-warning/30 bg-warning-subtle text-warning-text",
    danger: "border border-danger/30 bg-danger-subtle text-danger-text",
    success: "border border-success/30 bg-success-subtle text-success-text",
    info: "border border-info/30 bg-info-subtle text-info-text",
    purple: "border border-purple/30 bg-purple-subtle text-purple-text",
   },
   size: {
    sm: "px-2 py-0.5 text-[0.625rem]",
    md: "px-2.5 py-1 text-[0.625rem]",
    lg: "px-3 py-1.5 text-xs",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "md",
  },
 },
);

type BadgeProps = React.ComponentProps<"span"> &
 VariantProps<typeof badgeVariants>;

function Badge({ className, variant, size, children, ...rest }: BadgeProps) {
 return (
  <span className={cn(badgeVariants({ variant, size, className }))} {...rest}>
   {children}
  </span>
 );
}

export { Badge, badgeVariants };
