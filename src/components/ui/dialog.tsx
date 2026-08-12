"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const dialogContentVariants = cva(
 "fixed left-1/2 z-101 flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] -translate-x-1/2 flex-col gap-0 rounded-xl p-0 shadow-theme-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
 {
  variants: {
   size: {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    command: "max-w-3xl",
    editor: "max-w-5xl",
   },
   placement: {
    center: "top-1/2 -translate-y-1/2",
    top: "top-[max(4rem,8vh)]",
   },
   scrollMode: {
    body: "overflow-hidden",
    content: "overflow-y-auto",
    none: "overflow-visible",
   },
   surface: {
    default: "border border-border-default bg-bg-card",
    glass: "border border-border-default bg-bg-card",
   },
  },
  defaultVariants: {
   size: "md",
   placement: "center",
   scrollMode: "body",
   surface: "default",
  },
 },
);

function DialogOverlay({
 className,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
 return (
  <DialogPrimitive.Overlay
   data-slot="dialog-overlay"
   className={cn(
    "fixed inset-0 z-100 bg-overlay",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    className,
   )}
   {...props}
  />
 );
}

function DialogContent({
 className,
 children,
 showCloseButton = true,
 size,
 placement,
 scrollMode,
 surface,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
 VariantProps<typeof dialogContentVariants> & {
  showCloseButton?: boolean;
 }) {
 return (
  <DialogPortal>
   <DialogOverlay />
   <DialogPrimitive.Content
    data-slot="dialog-content"
    data-size={size}
    data-placement={placement}
    data-scroll-mode={scrollMode}
    className={cn(dialogContentVariants({ size, placement, scrollMode, surface }), className)}
    {...props}
   >
    {children}

    {showCloseButton && (
     <DialogPrimitive.Close asChild>
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       className="absolute right-3 top-3"
       aria-label="Đóng dialog"
      >
       <X />
      </Button>
     </DialogPrimitive.Close>
    )}
   </DialogPrimitive.Content>
  </DialogPortal>
 );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="dialog-header"
   className={cn(
    "grid shrink-0 gap-1 border-b border-border-default bg-bg-subtle px-4 py-3 pr-12",
    className,
   )}
   {...props}
  />
 );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="dialog-body"
   className={cn("grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 scrollbar-soft", className)}
   {...props}
  />
 );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="dialog-footer"
   className={cn(
    "flex shrink-0 flex-col-reverse gap-2 border-t border-border-default px-4 py-3 sm:flex-row sm:justify-end",
    className,
   )}
   {...props}
  />
 );
}

function DialogTitle({
 className,
 icon,
 children,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Title> & { icon?: React.ReactNode }) {
 return (
  <DialogPrimitive.Title
   data-slot="dialog-title"
   className={cn("flex items-center gap-2 text-xl font-black text-text-primary", className)}
   {...props}
  >
   {icon ? <span className="text-accent-text [&_svg]:size-5">{icon}</span> : null}
   {children}
  </DialogPrimitive.Title>
 );
}

function DialogDescription({
 className,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
 return (
  <DialogPrimitive.Description
   data-slot="dialog-description"
   className={cn("font-semibold text-text-muted", className)}
   {...props}
  />
 );
}

export {
 Dialog,
 DialogBody,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogOverlay,
 DialogPortal,
 DialogTitle,
 DialogTrigger,
 dialogContentVariants,
};
