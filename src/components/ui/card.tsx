import type * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("rounded-xl border", {
 variants: {
  variant: {
   default: "border-border-default bg-bg-card",
   elevated: "border-border-default/80 bg-bg-card shadow-theme-sm",
   section: "border-border-default/80 bg-bg-card",
   subtle: "border-border-default bg-bg-subtle",
   interactive:
    "border-border-default bg-bg-card transition-colors hover:border-primary/25 hover:bg-bg-elevated focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
   glass: "border-border-default bg-bg-card",
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
