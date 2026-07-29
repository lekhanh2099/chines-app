"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Button } from "@/components/ui/button";
import {
 BookOpen,
 BookText,
 GraduationCap,
 Languages,
 Library,
 NotebookPen,
 Shapes,
 SquareCheckBig,
} from "lucide-react";

import type { HanziHomeSearchIndexItem } from "./types";

const kindConfig = {
 vocab: { label: "Từ vựng", icon: Languages },
 grammar: { label: "Ngữ pháp", icon: GraduationCap },
 lesson_text: { label: "Bài khóa", icon: BookText },
 section: { label: "Đề mục", icon: BookOpen },
 exercise: { label: "Bài tập", icon: SquareCheckBig },
 radical: { label: "Bộ thủ", icon: Shapes },
 note: { label: "Ghi chú", icon: NotebookPen },
 navigation: { label: "Điều hướng", icon: Library },
} satisfies Record<HanziHomeSearchIndexItem["kind"], { label: string; icon: typeof BookOpen }>;

type SearchResultItemProps = {
 item: HanziHomeSearchIndexItem;
 selected: boolean;
 onSelect: () => void;
 onOpen: () => void;
};

export function SearchResultItem({ item, selected, onSelect, onOpen }: SearchResultItemProps) {
 const config = kindConfig[item.kind];
 const Icon = config.icon;

 return (
  <Button
   type="button"
   role="option"
   aria-selected={selected}
   onMouseEnter={onSelect}
   onFocus={onSelect}
   onClick={onOpen}
   variant={selected ? "active" : "ghost"}
   size="result"
   align="start"
   layout="grid"
   className="w-full grid-cols-[2.25rem_minmax(0,1fr)]"
  >
   <StudyInstructionText
    as="span"
    tone="accent"
    className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-card ring-1 ring-border-default"
   >
    <Icon className="h-4 w-4" />
   </StudyInstructionText>
   <span className="min-w-0">
    <span className="flex min-w-0 items-center gap-2">
     <StudyInstructionText tone="default" weight="bold" clamp="one">
      {item.title}
     </StudyInstructionText>
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="bold"
      scale="micro"
      transform="uppercase"
      className="shrink-0 rounded-md bg-bg-subtle px-1.5 py-0.5"
     >
      {config.label}
     </StudyInstructionText>
    </span>
    {item.subtitle && (
     <StudyInstructionText
      variant="bodySmall"
      tone="muted"
      weight="medium"
      clamp="one"
      className="mt-0.5 block"
     >
      {item.subtitle}
     </StudyInstructionText>
    )}
   </span>
  </Button>
 );
}
