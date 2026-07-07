"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LessonModuleSidebarItemProps = {
 selected: boolean;
 title: string;
 subtitle?: string;
 marker?: ReactNode;
 icon?: ReactNode;
 onClick: () => void;
};

export function LessonModuleSidebarItem({
 selected,
 title,
 subtitle,
 marker,
 icon,
 onClick,
}: LessonModuleSidebarItemProps) {
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "flex min-h-14 w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    selected
     ? "app-active-item"
     : "border-border-default bg-bg-subtle text-text-primary hover:bg-bg-primary",
   )}
  >
   {icon && <span className="shrink-0 opacity-90">{icon}</span>}
   <span className="min-w-0 flex-1">
    <span className="block line-clamp-2  font-black">{title}</span>
    {subtitle && (
     <span className="mt-0.5 block line-clamp-2 text-xs font-semibold opacity-80">{subtitle}</span>
    )}
   </span>
   {marker && <span className="shrink-0 text-xs font-bold">{marker}</span>}
  </button>
 );
}
