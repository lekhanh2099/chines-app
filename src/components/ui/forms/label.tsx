"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
 "flex items-center gap-2 leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
 {
  variants: {
   variant: {
    default: "text-sm font-medium",
    label: "text-sm font-bold",
    caption: "text-xs font-semibold",
    overline: "text-xs font-black uppercase tracking-wide",
   },
   tone: {
    default: "text-text-primary",
    secondary: "text-text-secondary",
    muted: "text-text-muted",
    danger: "text-danger-text",
   },
   weight: {
    inherit: "",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    black: "font-black",
   },
   surface: {
    plain: "",
    fieldCard: "items-start gap-3 rounded-xl border border-border-default bg-bg-card p-3",
   },
  },
  defaultVariants: {
   variant: "default",
   tone: "default",
   weight: "inherit",
   surface: "plain",
  },
 },
);

function Label({
 className,
 variant,
 tone,
 weight,
 surface,
 ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>) {
 return (
  <LabelPrimitive.Root
   data-slot="label"
   className={cn(labelVariants({ variant, tone, weight, surface }), className)}
   {...props}
  />
 );
}

export { Label, labelVariants };
