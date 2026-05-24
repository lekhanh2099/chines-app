"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
 open,
 onOpenChange,
 children,
 side = "right",
 className,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 children: React.ReactNode;
 side?: "right" | "bottom";
 className?: string;
}) {
 if (!open) return null;
 return (
  <div className="fixed inset-0 z-50 overflow-x-hidden scrollbar-soft ">
   <button
    type="button"
    aria-label="Đóng"
    className="absolute inset-0 bg-stone-900/30"
    onClick={() => onOpenChange(false)}
   />
   <div
    className={cn(
     "absolute max-w-full overflow-y-auto scrollbar-soft  overflow-x-hidden scrollbar-soft  border-border-default bg-bg-card shadow-theme-lg",
     side === "right"
      ? "right-0 top-0 h-full w-full border-l-2 sm:max-w-2xl"
      : "inset-x-0 bottom-0 max-h-[82vh] w-full rounded-2xl -t-3xl border-t-2",
     className,
    )}
   >
    {children}
   </div>
  </div>
 );
}

export function SheetHeader({
 title,
 onClose,
}: {
 title: string;
 onClose: () => void;
}) {
 return (
  <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
   <h2 className="min-w-0 break-words text-2xl font-black text-stone-900">
    {title}
   </h2>
   <button
    type="button"
    onClick={onClose}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-default text-text-muted hover:bg-bg-subtle"
   >
    <X className="h-5 w-5" />
   </button>
  </div>
 );
}
