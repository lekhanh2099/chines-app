"use client";

import { Popover } from "@base-ui/react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BasePopoverPopupProps = Omit<React.ComponentProps<typeof Popover.Popup>, "className"> & {
 variant?: "default" | "actions" | "lookup" | "menu";
};

const popupVariants: Record<NonNullable<BasePopoverPopupProps["variant"]>, string> = {
 default:
  "max-w-[calc(100vw-1rem)] rounded-xl border border-border-default bg-bg-elevated shadow-theme-lg",
 actions:
  "flex max-w-[calc(100vw-1rem)] items-center gap-1 rounded-xl border border-border-default bg-bg-elevated p-1 shadow-theme-lg",
 lookup:
  "w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-theme-lg",
 menu:
  "grid w-72 max-w-[calc(100vw-1rem)] gap-2 rounded-xl border border-border-default bg-bg-elevated p-2 text-sm shadow-theme-lg",
};

type BasePopoverTriggerProps = Omit<
 React.ComponentProps<typeof Popover.Trigger>,
 "className" | "render"
> & { active?: boolean };

function BasePopoverTrigger({ active = false, ...props }: BasePopoverTriggerProps) {
 return (
  <Popover.Trigger
   render={<Button variant={active ? "active" : "outline"} size="sm" />}
   {...props}
  />
 );
}

function BasePopoverPositioner({
 className,
 ...props
}: React.ComponentProps<typeof Popover.Positioner>) {
 return <Popover.Positioner className={cn("z-120", className)} {...props} />;
}

function BasePopoverPopup({ variant = "default", ...props }: BasePopoverPopupProps) {
 return (
  <Popover.Popup
   className={popupVariants[variant]}
   role={variant === "menu" ? "menu" : undefined}
   {...props}
  />
 );
}

export { Popover as BasePopover, BasePopoverPopup, BasePopoverPositioner, BasePopoverTrigger };
