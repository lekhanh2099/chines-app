"use client";

import * as React from "react";
import { Check, ChevronRight, Circle } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const dropdownMenuContentVariants = cva(
 "z-[120] max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-border-default bg-bg-elevated text-text-primary shadow-theme-lg outline-none scrollbar-soft data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
 {
  variants: {
   width: {
    content: "min-w-48",
    trigger: "min-w-[var(--radix-dropdown-menu-trigger-width)]",
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
   },
   density: {
    compact: "p-1",
    default: "p-1.5",
   },
  },
  defaultVariants: {
   width: "content",
   density: "default",
  },
 },
);

const dropdownMenuItemVariants = cva(
 "relative flex cursor-default select-none items-center gap-2 rounded-lg outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
 {
  variants: {
   tone: {
    default: "text-text-primary",
    accent: "text-accent-text data-[highlighted]:bg-accent-subtle",
    destructive:
     "text-danger-text data-[highlighted]:bg-danger-subtle data-[highlighted]:text-danger-text",
   },
   density: {
    compact: "min-h-8 px-2 py-1.5 text-xs font-semibold",
    default: "min-h-10 px-2.5 py-2 text-sm font-semibold",
   },
   inset: {
    true: "pl-8",
    false: "",
   },
  },
  defaultVariants: {
   tone: "default",
   density: "default",
   inset: false,
  },
 },
);

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

function DropdownMenuTrigger(props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
 return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
 className,
 sideOffset = 8,
 align = "start",
 loop = true,
 width,
 density,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> &
 VariantProps<typeof dropdownMenuContentVariants>) {
 return (
  <DropdownMenuPrimitive.Portal>
   <DropdownMenuPrimitive.Content
    data-slot="dropdown-menu-content"
    sideOffset={sideOffset}
    align={align}
    loop={loop}
    className={cn(dropdownMenuContentVariants({ width, density }), className)}
    {...props}
   />
  </DropdownMenuPrimitive.Portal>
 );
}

function DropdownMenuItem({
 className,
 tone,
 density,
 inset,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> &
 VariantProps<typeof dropdownMenuItemVariants>) {
 return (
  <DropdownMenuPrimitive.Item
   data-slot="dropdown-menu-item"
   className={cn(dropdownMenuItemVariants({ tone, density, inset }), className)}
   {...props}
  />
 );
}

function DropdownMenuCheckboxItem({
 className,
 children,
 tone,
 density,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> &
 Pick<VariantProps<typeof dropdownMenuItemVariants>, "tone" | "density">) {
 return (
  <DropdownMenuPrimitive.CheckboxItem
   data-slot="dropdown-menu-checkbox-item"
   className={cn(dropdownMenuItemVariants({ tone, density, inset: true }), className)}
   {...props}
  >
   <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
    <DropdownMenuPrimitive.ItemIndicator>
     <Check className="size-4" />
    </DropdownMenuPrimitive.ItemIndicator>
   </span>
   {children}
  </DropdownMenuPrimitive.CheckboxItem>
 );
}

function DropdownMenuRadioItem({
 className,
 children,
 tone,
 density,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> &
 Pick<VariantProps<typeof dropdownMenuItemVariants>, "tone" | "density">) {
 return (
  <DropdownMenuPrimitive.RadioItem
   data-slot="dropdown-menu-radio-item"
   className={cn(dropdownMenuItemVariants({ tone, density, inset: true }), className)}
   {...props}
  >
   <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
    <DropdownMenuPrimitive.ItemIndicator>
     <Circle className="size-2 fill-current" />
    </DropdownMenuPrimitive.ItemIndicator>
   </span>
   {children}
  </DropdownMenuPrimitive.RadioItem>
 );
}

function DropdownMenuLabel({
 className,
 inset = false,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
 inset?: boolean;
}) {
 return (
  <DropdownMenuPrimitive.Label
   data-slot="dropdown-menu-label"
   className={cn(
    "px-2.5 py-1.5 text-xs font-black uppercase tracking-wide text-text-muted",
    inset && "pl-8",
    className,
   )}
   {...props}
  />
 );
}

function DropdownMenuSeparator({
 className,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
 return (
  <DropdownMenuPrimitive.Separator
   data-slot="dropdown-menu-separator"
   className={cn("-mx-0.5 my-1 h-px bg-border-default", className)}
   {...props}
  />
 );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
 return (
  <span
   data-slot="dropdown-menu-shortcut"
   className={cn("ml-auto text-xs font-semibold tracking-widest text-text-muted", className)}
   {...props}
  />
 );
}

function DropdownMenuSubTrigger({
 className,
 children,
 tone,
 density,
 inset,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> &
 VariantProps<typeof dropdownMenuItemVariants>) {
 return (
  <DropdownMenuPrimitive.SubTrigger
   data-slot="dropdown-menu-sub-trigger"
   className={cn(
    dropdownMenuItemVariants({ tone, density, inset }),
    "data-[state=open]:bg-muted",
    className,
   )}
   {...props}
  >
   {children}
   <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
 );
}

function DropdownMenuSubContent({
 className,
 sideOffset = 6,
 alignOffset = -4,
 loop = true,
 width,
 density,
 ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> &
 VariantProps<typeof dropdownMenuContentVariants>) {
 return (
  <DropdownMenuPrimitive.Portal>
   <DropdownMenuPrimitive.SubContent
    data-slot="dropdown-menu-sub-content"
    sideOffset={sideOffset}
    alignOffset={alignOffset}
    loop={loop}
    className={cn(dropdownMenuContentVariants({ width, density }), className)}
    {...props}
   />
  </DropdownMenuPrimitive.Portal>
 );
}

export {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuPortal,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuShortcut,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
 dropdownMenuContentVariants,
 dropdownMenuItemVariants,
};
