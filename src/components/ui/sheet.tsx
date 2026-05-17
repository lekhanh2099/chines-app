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
  <div className="fixed inset-0 z-50">
   <button
    type="button"
    aria-label="Đóng"
    className="absolute inset-0 bg-stone-900/30"
    onClick={() => onOpenChange(false)}
   />
   <div
    className={cn(
     "absolute overflow-y-auto border-stone-200 bg-white shadow-2xl",
     side === "right"
      ? "right-0 top-0 h-full w-full max-w-2xl border-l-2"
      : "inset-x-0 bottom-0 max-h-[82vh] rounded-t-[28px] border-t-2",
     className,
    )}
   >
    {children}
   </div>
  </div>
 );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
 return (
  <div className="mb-5 flex items-center justify-between gap-3">
   <h2 className="text-2xl font-black text-stone-900">{title}</h2>
   <button
    type="button"
    onClick={onClose}
    className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-stone-200 text-stone-600 hover:bg-stone-50"
   >
    <X className="h-5 w-5" />
   </button>
  </div>
 );
}
