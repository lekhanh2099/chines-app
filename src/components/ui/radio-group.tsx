"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { focusRingClassName, invalidFocusRingClassName } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";

function RadioGroup({
 className,
 ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
 return (
  <RadioGroupPrimitive.Root
   data-slot="radio-group"
   className={cn("grid gap-2", className)}
   {...props}
  />
 );
}

function RadioGroupItem({
 className,
 ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
 return (
  <RadioGroupPrimitive.Item
   data-slot="radio-group-item"
   className={cn(
    "grid size-4 shrink-0 place-items-center rounded-full border border-input transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary",
    focusRingClassName,
    invalidFocusRingClassName,
    className,
   )}
   {...props}
  >
   <RadioGroupPrimitive.Indicator
    data-slot="radio-group-indicator"
    className="size-2 rounded-full bg-primary"
   />
  </RadioGroupPrimitive.Item>
 );
}

export { RadioGroup, RadioGroupItem };
