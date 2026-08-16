import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-xl border", {
 variants: {
  variant: {
   default: "border-border-default bg-surface",
   elevated: "border-border-default bg-surface-raised shadow-theme-sm",
   section: "border-border-default bg-surface",
   subtle: "border-border-default bg-surface-muted",
   interactive:
    "border-border-default bg-surface transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft",
   glass: "border-border-default bg-surface",
  },
  padding: {
   none: "",
   sm: "p-2.5",
   md: "p-3 sm:p-4",
   lg: "p-4 sm:p-5",
  },
 },
 defaultVariants: {
  variant: "default",
  padding: "md",
 },
});

type CardProps = React.ComponentProps<"div"> &
 VariantProps<typeof cardVariants> & {
  asChild?: boolean;
 };

function Card({ className, variant, padding, asChild = false, children, ...rest }: CardProps) {
 const Comp = asChild ? Slot.Root : "div";

 return (
  <Comp data-slot="card" className={cn(cardVariants({ variant, padding }), className)} {...rest}>
   {children}
  </Comp>
 );
}

export { Card, cardVariants };
