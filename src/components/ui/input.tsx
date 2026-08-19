import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { focusRingClassName, invalidFocusRingClassName } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";

const inputVariants = cva(
 cn(
  "flex w-full rounded-lg border text-text-primary transition-colors placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:font-medium",
  focusRingClassName,
  invalidFocusRingClassName,
 ),
 {
  variants: {
   density: {
    compact: "min-h-9 px-2.5 py-1.5 text-sm",
    default: "min-h-11 px-3 py-2",
    comfortable: "min-h-12 px-4 py-3",
    search: "h-10 px-3 py-2 xl:h-11",
   },
   surface: {
    default: "border-input bg-bg-input",
    field: "border-input bg-bg-input",
    card: "border-border-default bg-bg-card",
    transparent: "border-transparent bg-transparent",
   },
   adornment: {
    none: "",
    start: "pl-10",
    end: "pr-10",
    both: "px-10",
   },
   validation: {
    none: "",
    success: "border-success bg-success-subtle",
    danger: "border-destructive",
   },
  },
  defaultVariants: {
   density: "default",
   surface: "default",
   adornment: "none",
   validation: "none",
  },
 },
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
 ({ adornment, className, density, surface, type, validation, ...props }, ref) => {
  return (
   <input
    type={type}
    className={cn(inputVariants({ adornment, density, surface, validation }), className)}
    ref={ref}
    {...props}
   />
  );
 },
);
Input.displayName = "Input";

type InputProps = React.ComponentPropsWithoutRef<"input"> & VariantProps<typeof inputVariants>;

export { Input, inputVariants };
export type { InputProps };
