"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

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
  <Button
   type="button"
   variant={selected ? "active" : "surface"}
   onClick={onClick}
   className="h-auto min-h-14 w-full min-w-0 max-w-full justify-start gap-3 overflow-hidden whitespace-normal rounded-lg p-2.5 text-left"
  >
   {icon && <span className="shrink-0 opacity-90">{icon}</span>}
   <span className="min-w-0 flex-1">
    <span className="block line-clamp-2  font-black">{title}</span>
    {subtitle && (
     <span className="mt-0.5 block line-clamp-2 text-xs font-semibold opacity-80">{subtitle}</span>
    )}
   </span>
   {marker && <span className="shrink-0 text-xs font-bold">{marker}</span>}
  </Button>
 );
}
