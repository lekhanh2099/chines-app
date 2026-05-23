"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

function DialogOverlay({
 className,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
 return (
  <DialogPrimitive.Overlay
   data-slot="dialog-overlay"
   className={cn(
    "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
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
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
 showCloseButton?: boolean;
}) {
 return (
  <DialogPortal>
   <DialogOverlay />
   <DialogPrimitive.Content
    data-slot="dialog-content"
    className={cn(
     "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl  border-2 border-border-default bg-bg-card p-5 shadow outline-none sm:p-6",
     "data-[state=open]:animate-in data-[state=closed]:animate-out",
     "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
     "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
     className,
    )}
    {...props}
   >
    {children}

    {showCloseButton && (
     <DialogPrimitive.Close asChild>
      <Button
       type="button"
       variant="ghost"
       size="icon"
       className="absolute right-4 top-4"
       aria-label="Đóng dialog"
      >
       <X className="h-4 w-4" />
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
   className={cn("grid gap-1 pr-10", className)}
   {...props}
  />
 );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="dialog-body"
   className={cn("grid gap-4", className)}
   {...props}
  />
 );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   data-slot="dialog-footer"
   className={cn(
    "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
    className,
   )}
   {...props}
  />
 );
}

function DialogTitle({
 className,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
 return (
  <DialogPrimitive.Title
   data-slot="dialog-title"
   className={cn("text-xl font-black text-text-primary", className)}
   {...props}
  />
 );
}

function DialogDescription({
 className,
 ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
 return (
  <DialogPrimitive.Description
   data-slot="dialog-description"
   className={cn("text-sm font-semibold text-text-muted", className)}
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
 DialogPortal,
 DialogTitle,
 DialogTrigger,
};
