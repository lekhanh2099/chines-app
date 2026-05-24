import type * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const iconButtonVariants = cva(
 "inline-flex items-center justify-center rounded-full border transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0",
 {
  variants: {
   variant: {
    default:
     "border-border-default bg-bg-primary text-text-muted hover:border-accent hover:text-accent",
    ghost:
     "border-transparent bg-transparent text-text-muted hover:bg-bg-subtle hover:text-text-primary",
    accent: "border-accent bg-accent   hover:bg-accent-hover",
   },
   size: {
    sm: "h-7 w-7 [&_svg]:h-3 [&_svg]:w-3",
    md: "h-9 w-9 [&_svg]:h-4 [&_svg]:w-4",
    lg: "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "md",
  },
 },
);

type IconButtonProps = React.ComponentProps<"button"> &
 ButtonPrimitive.Props &
 VariantProps<typeof iconButtonVariants>;

function IconButton({
 className,
 variant,
 size,
 children,
 ...rest
}: IconButtonProps) {
 return (
  <ButtonPrimitive
   className={cn(iconButtonVariants({ variant, size, className }))}
   type="button"
   {...rest}
  >
   {children}
  </ButtonPrimitive>
 );
}

export { IconButton, iconButtonVariants };
