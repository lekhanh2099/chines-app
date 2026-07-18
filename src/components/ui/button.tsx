import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
 "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
 {
  variants: {
   variant: {
    default: "bg-primary text-primary-foreground shadow-theme-sm hover:bg-primary/90 hover:shadow",
    outline:
     "border-border bg-bg-card/80 shadow-theme-sm backdrop-blur hover:border-primary/25 hover:bg-accent-subtle hover:text-accent-text aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
    secondary:
     "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
    ghost:
     "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
    active: "app-active-item",
    surface:
     "border-border-default bg-bg-subtle text-text-secondary shadow-theme-sm hover:bg-bg-elevated hover:text-text-primary",
    surfaceCard:
     "border-border-default bg-bg-card text-text-primary shadow-theme-sm hover:bg-bg-elevated",
    menu:
     "w-full justify-start border-transparent bg-transparent text-text-primary shadow-none hover:bg-muted data-[highlighted]:bg-muted",
    menuActive: "app-active-item w-full justify-start shadow-none",
    menuDestructive:
     "w-full justify-start border-transparent bg-transparent text-danger-text shadow-none hover:bg-danger-subtle focus-visible:border-danger/40 focus-visible:ring-danger/20",
    destructive:
     "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
    link: "text-primary underline-offset-4 hover:underline",
   },
   size: {
    default:
     "min-h-11 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
    touch:
     "min-h-11 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
    compact:
     "min-h-8 gap-1 rounded-lg px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
    toolbar:
     "min-h-9 gap-1.5 rounded-lg px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    menu: "min-h-10 gap-2 rounded-lg px-2.5 text-sm",
    xs: "min-h-11 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
    sm: "min-h-11 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
    lg: "min-h-11 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
    icon: "size-11",
    "icon-xs":
     "size-9 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
    "icon-sm":
     "size-10 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
    "icon-lg": "size-11",
    "icon-toolbar": "size-9 rounded-lg",
    "icon-round": "size-10 rounded-full",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "default",
  },
 },
);

function Button({
 className,
 variant = "default",
 size = "default",
 asChild = false,
 ...props
}: React.ComponentProps<"button"> &
 VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
 }) {
 const Comp = asChild ? Slot.Root : "button";

 return (
  <Comp
   data-slot="button"
   data-variant={variant}
   data-size={size}
   className={cn(buttonVariants({ variant, size, className }))}
   {...(!asChild ? { type: "button" } : {})}
   {...props}
  />
 );
}

export { Button, buttonVariants };
