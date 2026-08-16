import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { focusRingClassName, invalidFocusRingClassName } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
 cn(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all select-none active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  focusRingClassName,
  invalidFocusRingClassName,
 ),
 {
  variants: {
   variant: {
    default:
     "border-primary bg-primary text-primary-foreground shadow-theme-sm hover:border-primary-hover hover:bg-primary-hover",
    outline:
     "border-border-default bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted aria-expanded:bg-surface-muted aria-expanded:text-foreground",
    secondary:
     "border-border-default bg-surface-muted text-foreground hover:bg-surface-hover aria-expanded:bg-surface-hover aria-expanded:text-foreground",
    ghost:
     "hover:bg-surface-muted hover:text-foreground aria-expanded:bg-surface-muted aria-expanded:text-foreground",
    navigation:
     "border-transparent text-foreground-muted hover:bg-surface-muted hover:text-foreground",
    active: "app-active-item [&_[data-slot=typography]]:text-inherit",
    surface:
     "border-border-default bg-bg-subtle text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
    surfaceCard: "border-border-default bg-bg-card text-text-primary hover:bg-bg-elevated",
    avatar: "border-border-default bg-accent-subtle text-accent-text hover:bg-bg-elevated",
    avatarWarning: "border-warning/35 bg-warning-subtle text-warning-text hover:bg-bg-elevated",
    menu:
     "w-full justify-start border-transparent bg-transparent text-text-primary shadow-none hover:bg-muted data-[highlighted]:bg-muted",
    menuActive:
     "app-active-item w-full justify-start shadow-none [&_[data-slot=typography]]:text-inherit",
    menuDestructive:
     "w-full justify-start border-transparent bg-transparent text-danger-text shadow-none hover:bg-danger-subtle focus-visible:border-danger/40 focus-visible:ring-danger/20",
    destructive:
     "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
    warning:
     "border-warning/30 bg-warning-subtle text-warning-text hover:bg-warning-subtle focus-visible:border-warning/50 focus-visible:ring-warning/20",
    dashed:
     "border-dashed border-border-default bg-transparent text-text-muted hover:border-primary/30 hover:bg-bg-subtle hover:text-text-primary",
    success:
     "border-success bg-success-subtle text-success-text hover:bg-success-subtle focus-visible:border-success focus-visible:ring-success/20",
    swatch:
     "border-border-default opacity-80 hover:border-primary/45 hover:opacity-100 aria-pressed:border-primary aria-pressed:opacity-100",
    link: "text-primary underline-offset-4 hover:underline",
   },
   size: {
    touch:
     "min-h-11 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
    compact:
     "min-h-8 gap-1 rounded-lg px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
    toolbar:
     "min-h-9 gap-1.5 rounded-lg px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    menu: "min-h-10 gap-2 rounded-lg px-2.5 text-sm",
    sm: "min-h-11 gap-1 rounded-lg px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
    lg: "min-h-11 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
    icon: "size-11",
    "icon-xs":
     "size-9 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
    "icon-sm": "size-10 rounded-lg in-data-[slot=button-group]:rounded-lg",
    "icon-lg": "size-11",
    "icon-toolbar": "size-9 rounded-lg",
    "icon-round": "size-10 rounded-full",
    inline:
     "min-h-0 min-w-[1.25em] h-auto gap-0 rounded-md px-0.5 py-0.5 align-baseline font-inherit leading-[inherit] select-text",
    tab: "h-9 min-h-9 gap-1.5 rounded-lg px-2 sm:h-11 sm:min-h-11 sm:gap-2 sm:px-3",
   },
   align: {
    center: "justify-center text-center",
    start: "justify-start text-left",
    between: "justify-between",
   },
   wrap: {
    nowrap: "whitespace-nowrap",
    normal: "whitespace-normal",
   },
   layout: {
    inline: "inline-flex",
    grid: "grid",
   },
   emphasis: {
    normal: "",
    overline: "uppercase tracking-wide",
   },
   validation: {
    none: "",
    warning: "border-warning/45",
    success: "border-success/35",
    dropTarget: "hover:border-accent/60",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "touch",
   align: "center",
   wrap: "nowrap",
   layout: "inline",
   emphasis: "normal",
   validation: "none",
  },
 },
);

function Button({
 className,
 variant = "default",
 size = "touch",
 align = "center",
 wrap = "nowrap",
 layout = "inline",
 emphasis = "normal",
 validation = "none",
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
   className={cn(
    buttonVariants({ variant, size, align, wrap, layout, emphasis, validation, className }),
   )}
   {...(!asChild ? { type: "button" } : {})}
   {...props}
  />
 );
}

export { Button, buttonVariants };
