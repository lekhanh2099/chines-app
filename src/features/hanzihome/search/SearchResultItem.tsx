"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
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
 id: string;
 item: HanziHomeSearchIndexItem;
 selected: boolean;
 onSelect: () => void;
 onOpen: () => void;
};

export function SearchResultItem({ id, item, selected, onSelect, onOpen }: SearchResultItemProps) {
 const config = kindConfig[item.kind];
 const Icon = config.icon;

 return (
  <Button
   id={id}
   type="button"
   role="option"
   aria-selected={selected}
   tabIndex={-1}
   onMouseEnter={onSelect}
   onClick={onOpen}
   variant={selected ? "active" : "ghost"}
   size="menu"
   align="start"
   wrap="normal"
   layout="grid"
   className="w-full grid-cols-[2.25rem_minmax(0,1fr)]"
  >
   <IconTile size="sm">
    <Icon />
   </IconTile>
   <span className="grid min-w-0 gap-0.5">
    <span className="flex min-w-0 items-center gap-2">
     <Typography as="span" variant="label" tone="default" weight="bold" clamp="one">
      {item.title}
     </Typography>
     <Badge size="sm" className="shrink-0">
      {config.label}
     </Badge>
    </span>
    {item.subtitle ? (
     <Typography
      as="span"
      variant="bodySmall"
      tone="muted"
      weight="medium"
      clamp="one"
      className="block"
     >
      {item.subtitle}
     </Typography>
    ) : null}
   </span>
  </Button>
 );
}
