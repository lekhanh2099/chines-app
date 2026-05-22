import type * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const buttonVariantsConfig = {
 variants: {
  variant: {
   default:
    "bg-accent text-white hover:bg-accent-hover disabled:bg-accent/50 disabled:text-white/50 shadow-theme-sm",
   outline:
    "border border-border-default bg-transparent hover:bg-bg-subtle text-text-primary disabled:opacity-50",
   ghost:
    "bg-transparent text-text-secondary hover:bg-bg-subtle hover:text-text-primary disabled:opacity-50",
   link: "text-accent underline-offset-4 hover:underline disabled:opacity-50",
  },
  size: {
   default: "h-11 px-5 py-2 has-[>svg]:px-4",
   sm: "h-9 px-3 text-xs has-[>svg]:px-2.5",
   lg: "h-14 px-8 text-base has-[>svg]:px-6",
   icon: "size-11 min-w-auto",
   "icon-sm": "size-9 min-w-auto",
   "icon-lg": "size-14 min-w-auto",
  },
 },
 defaultVariants: {
  variant: "default",
  size: "default",
 },
} as const;

const buttonVariants = cva(
 "inline-flex min-w-20 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-bold outline-none transition-colors disabled:cursor-not-allowed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
 buttonVariantsConfig,
);

const buttonVariantList = {
 variant: Object.keys(buttonVariantsConfig.variants.variant),
 size: Object.keys(buttonVariantsConfig.variants.size),
} as const;

export type ButtonProps = React.ComponentProps<"button"> &
 ButtonPrimitive.Props &
 VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
 };

function Button({
 className,
 variant = "default",
 size = "default",
 asChild = false,
 isLoading = false,
 loadingText = "Đang xử lý...",
 children,
 ...rest
}: ButtonProps) {
 const Comp = asChild && !isLoading ? Slot : ButtonPrimitive;
 const buttonContent = isLoading ? (
  <>
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   {loadingText}
  </>
 ) : (
  children
 );

 return (
  <Comp
   data-slot="button"
   className={cn(buttonVariants({ variant, size, className }))}
   {...(!asChild || isLoading ? { type: "button" } : {})}
   {...rest}
  >
   {buttonContent}
  </Comp>
 );
}

export { Button, buttonVariants, buttonVariantList };
