"use client";

import { Popover } from "@base-ui/react";
import * as React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BasePopoverVariantSchema = z.enum([
 "default",
 "actions",
 "lookup",
 "menu",
 "profile",
 "mobileActions",
 "moduleMenu",
 "selector",
]);

type BasePopoverPopupProps = Omit<React.ComponentProps<typeof Popover.Popup>, "className"> & {
 variant?: z.infer<typeof BasePopoverVariantSchema>;
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
 profile:
  "max-h-[calc(100dvh-1rem)] w-[min(23rem,calc(100vw-1rem))] overflow-x-hidden overflow-y-auto scrollbar-soft rounded-xl border border-border-default bg-bg-elevated p-2 shadow-theme-lg",
 mobileActions:
  "w-[min(19rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border-default bg-bg-elevated p-1.5 text-sm shadow-theme-lg",
 moduleMenu:
  "max-h-[min(24rem,calc(100dvh-7rem))] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto scrollbar-soft rounded-xl border border-border-default bg-bg-elevated p-1.5 text-sm shadow-theme-lg",
 selector:
  "w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-theme-lg",
};

type BasePopoverTriggerOwnedProps = {
 className?: never;
 render?: never;
};
type BasePopoverTriggerProps = Omit<
 React.ComponentProps<typeof Popover.Trigger>,
 keyof BasePopoverTriggerOwnedProps
> & { active?: boolean };

function BasePopoverTrigger({ active = false, ...props }: BasePopoverTriggerProps) {
 return (
  <Popover.Trigger
   render={<Button variant={active ? "active" : "outline"} size="toolbar" />}
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

function BasePopoverPopup({
 variant = BasePopoverVariantSchema.enum.default,
 ...props
}: BasePopoverPopupProps) {
 return <Popover.Popup className={popupVariants[variant]} {...props} />;
}

export {
 Popover as BasePopover,
 BasePopoverPopup,
 BasePopoverPositioner,
 BasePopoverTrigger,
 BasePopoverVariantSchema,
};
