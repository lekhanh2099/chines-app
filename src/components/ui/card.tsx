import type * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("rounded-[28px] border-2", {
 variants: {
  variant: {
   default: "border-border-default bg-bg-card",
   elevated: "border-border-default bg-bg-card shadow-theme-md",
   section: "border-border-default bg-bg-card shadow-theme-md",
   subtle: "border-border-default bg-stone-50",
  },
  padding: {
   none: "",
   sm: "p-3",
   md: "p-4 sm:p-5",
   lg: "p-5 sm:p-6",
  },
 },
 defaultVariants: {
  variant: "elevated",
  padding: "md",
 },
});

type CardProps = React.ComponentProps<"div"> &
 VariantProps<typeof cardVariants>;

function Card({ className, variant, padding, children, ...rest }: CardProps) {
 return (
  <div className={cn(cardVariants({ variant, padding, className }))} {...rest}>
   {children}
  </div>
 );
}

export { Card, cardVariants };
