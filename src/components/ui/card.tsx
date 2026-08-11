import type * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("rounded-xl border", {
 variants: {
  variant: {
   default: "border-border-default bg-bg-card",
   elevated: "border-border-default/80 bg-bg-card shadow-theme-sm",
   section: "border-border-default/80 bg-bg-card",
   subtle: "border-border-default bg-bg-subtle",
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

type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

function Card({ className, variant, padding, children, ...rest }: CardProps) {
 return (
  <div className={cn(cardVariants({ variant, padding, className }))} {...rest}>
   {children}
  </div>
 );
}

export { Card, cardVariants };
