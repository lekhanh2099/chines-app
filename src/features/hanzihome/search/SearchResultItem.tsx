"use client";

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

import { cn } from "@/lib/utils";

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
  <button
   type="button"
   role="option"
   aria-selected={selected}
   onMouseEnter={onSelect}
   onFocus={onSelect}
   onClick={onOpen}
   className={cn(
    "grid w-full grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition",
    selected ? "bg-accent-subtle ring-1 ring-accent/30" : "hover:bg-bg-subtle",
   )}
  >
   <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-card text-accent-text ring-1 ring-border-default">
    <Icon className="h-4 w-4" />
   </span>
   <span className="min-w-0">
    <span className="flex min-w-0 items-center gap-2">
     <span className="truncate font-bold text-text-primary">{item.title}</span>
     <span className="shrink-0 rounded-md bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-text-muted">
      {config.label}
     </span>
    </span>
    {item.subtitle && (
     <span className="mt-0.5 block truncate text-sm font-medium text-text-muted">
      {item.subtitle}
     </span>
    )}
   </span>
  </button>
 );
}
