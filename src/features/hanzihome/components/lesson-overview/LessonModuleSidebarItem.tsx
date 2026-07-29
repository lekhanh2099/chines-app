"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
   align="start"
   wrap="normal"
   className="w-full min-w-0 max-w-full overflow-hidden"
  >
   {icon && <span className="shrink-0 opacity-90">{icon}</span>}
   <span className="min-w-0 flex-1">
    <StudyInstructionText as="span" weight="black" clamp="two" className="block">
     {title}
    </StudyInstructionText>
    {subtitle && (
     <StudyInstructionText
      variant="caption"
      weight="semibold"
      clamp="two"
      className="mt-0.5 block opacity-80"
     >
      {subtitle}
     </StudyInstructionText>
    )}
   </span>
   {marker && (
    <StudyInstructionText variant="caption" weight="bold" className="shrink-0">
     {marker}
    </StudyInstructionText>
   )}
  </Button>
 );
}
