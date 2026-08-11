"use client";

import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
   variant={selected ? "active" : "navigation"}
   size="menu"
   onClick={onClick}
   align="start"
   wrap="normal"
   className="w-full min-w-0 max-w-full overflow-hidden"
  >
   {icon && <span className="shrink-0 opacity-90">{icon}</span>}
   <span className="min-w-0 flex-1">
    <HanziAwareText
     as="span"
     text={title}
     tone="inherit"
     weight="black"
     clamp="two"
     className="block"
    />
    {subtitle && (
     <HanziAwareText
      as="span"
      text={subtitle}
      variant="caption"
      tone="inherit"
      weight="semibold"
      clamp="two"
      className="mt-0.5 block opacity-80"
     />
    )}
   </span>
   {marker && (
    <StudyInstructionText variant="caption" tone="inherit" weight="bold" className="shrink-0">
     {marker}
    </StudyInstructionText>
   )}
  </Button>
 );
}
