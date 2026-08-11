"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SheetSideSchema = z.enum(["right", "bottom"]);

export function Sheet({
 open,
 onOpenChange,
 children,
 side = SheetSideSchema.enum.right,
 className,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 children: React.ReactNode;
 side?: z.infer<typeof SheetSideSchema>;
 className?: string;
}) {
 return (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
   <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-overlay" />
    <DialogPrimitive.Content
     aria-describedby={undefined}
     className={cn(
      "fixed z-101 flex max-w-full flex-col overflow-hidden border-border-default bg-bg-card shadow-theme-lg outline-none",
      side === "right"
       ? "right-0 top-0 h-full w-full border-l sm:max-w-2xl"
       : "inset-x-0 bottom-0 max-h-[82dvh] w-full rounded-t-xl border border-b-0",
      className,
     )}
    >
     {children}
    </DialogPrimitive.Content>
   </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
 );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
 return (
  <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border-default px-4 py-4 sm:px-5">
   <DialogPrimitive.Title className="min-w-0 break-words text-xl font-black text-text-primary sm:text-2xl">
    {title}
   </DialogPrimitive.Title>
   <DialogPrimitive.Close asChild>
    <Button
     type="button"
     variant="outline"
     size="icon-round"
     onClick={onClose}
     className="shrink-0"
     aria-label="Đóng"
    >
     <X />
    </Button>
   </DialogPrimitive.Close>
  </div>
 );
}

export function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   className={cn(
    "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 text-sm scrollbar-soft sm:px-5 sm:text-base",
    className,
   )}
   {...props}
  />
 );
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
  <div
   className={cn(
    "flex shrink-0 items-center justify-end gap-2 border-t border-border-default px-4 py-3 sm:px-5",
    className,
   )}
   {...props}
  />
 );
}
